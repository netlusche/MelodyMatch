import React, { useState } from 'react';
import { Song } from '../types';
import { X, Download, Copy, Check, FileSpreadsheet, ExternalLink, HelpCircle } from 'lucide-react';
import { translations } from '../i18n/translations';

interface PlaylistExportModalProps {
  songs: Song[];
  lang: 'en' | 'de';
  onClose: () => void;
}

export const PlaylistExportModal: React.FC<PlaylistExportModalProps> = ({ songs, lang, onClose }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'streaming'>('file');
  const [copied, setCopied] = useState(false);
  const t = translations[lang] || translations.en;

  const getSongTextList = () => {
    return songs.map(s => `${s.artist} - ${s.title} (${s.year})`).join('\n');
  };

  const handleCopyText = () => {
    const text = getSongTextList();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.warn("Failed to copy text", err);
      });
  };

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadM3U = () => {
    let m3u = '#EXTM3U\n';
    songs.forEach(song => {
      m3u += `#EXTINF:-1,${song.artist} - ${song.title}\n`;
      // Generate a Deezer search fallback URL for the player
      m3u += `https://www.deezer.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}\n`;
    });
    downloadBlob(m3u, 'melodymatch_favorites.m3u', 'audio/x-mpegurl');
  };

  const handleDownloadCSV = () => {
    // CSV Header
    let csv = '\uFEFFInterpret,Titel,Erscheinungsjahr,Deezer-Suche\n';
    songs.forEach(song => {
      const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;
      const searchUrl = `https://www.deezer.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}`;
      csv += `${escapeCSV(song.artist)},${escapeCSV(song.title)},${escapeCSV(song.year)},${escapeCSV(searchUrl)}\n`;
    });
    downloadBlob(csv, 'melodymatch_favorites.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} className="text-primary" />
              <span>{t.exportTitle}</span>
            </h3>
            <p className="modal-subtitle">{songs.length} {songs.length === 1 ? 'Song' : 'Songs'}</p>
          </div>
          <button 
            type="button" 
            className="icon-button outline" 
            onClick={onClose} 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <FileSpreadsheet size={14} style={{ marginRight: '0.35rem', display: 'inline-block', verticalAlign: 'middle' }} />
            <span>{t.fileTab}</span>
          </button>
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'streaming' ? 'active' : ''}`}
            onClick={() => setActiveTab('streaming')}
          >
            <HelpCircle size={14} style={{ marginRight: '0.35rem', display: 'inline-block', verticalAlign: 'middle' }} />
            <span>{t.streamingTab}</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === 'file' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                type="button" 
                className="option-button outline w-full justify-start"
                onClick={handleDownloadM3U}
                style={{ gap: '0.75rem', padding: '0.75rem 1rem' }}
              >
                <Download size={18} className="text-primary" />
                <span style={{ fontSize: '0.9rem' }}>{t.downloadM3U}</span>
              </button>
              
              <button 
                type="button" 
                className="option-button outline w-full justify-start"
                onClick={handleDownloadCSV}
                style={{ gap: '0.75rem', padding: '0.75rem 1rem' }}
              >
                <FileSpreadsheet size={18} className="text-success" />
                <span style={{ fontSize: '0.9rem' }}>{t.downloadCSV}</span>
              </button>

              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t.copyClipboard}</span>
                  <button 
                    type="button"
                    className="fav-action-btn"
                    onClick={handleCopyText}
                    style={{ 
                      alignSelf: 'flex-end', 
                      fontSize: '0.75rem', 
                      padding: '0.15rem 0.5rem', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      background: copied ? 'var(--success)' : 'transparent',
                      color: copied ? '#fff' : 'var(--text)',
                      border: copied ? 'none' : '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? t.copiedSuccess : t.copyClipboard.split(' ')[1] || 'Kopieren'}</span>
                  </button>
                </div>
                <textarea 
                  className="export-text-area"
                  readOnly
                  value={getSongTextList()}
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            </div>
          )}

          {activeTab === 'streaming' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <p style={{ margin: 0, textAlign: 'justify', lineHeight: 1.6 }}>
                {t.streamingInstructions}
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <a 
                  href="https://soundiiz.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="option-button outline sm"
                  style={{ textDecoration: 'none', flex: 1, minWidth: '130px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}
                >
                  <span>Soundiiz</span>
                  <ExternalLink size={14} />
                </a>
                <a 
                  href="https://www.tunemymusic.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="option-button outline sm"
                  style={{ textDecoration: 'none', flex: 1, minWidth: '130px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}
                >
                  <span>TuneMyMusic</span>
                  <ExternalLink size={14} />
                </a>
              </div>
              
              <button 
                type="button" 
                className="option-button primary outline sm mt-2" 
                onClick={handleCopyText}
                style={{ gap: '0.5rem', alignSelf: 'center', minHeight: '36px' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? t.copiedSuccess : t.copyClipboard}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem' }}>
          <button 
            type="button" 
            className="option-button primary sm w-full" 
            onClick={onClose}
          >
            <span>{t.closeBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
