import React, { useState } from 'react';
import { Heart, X, ChevronDown, Download, FileSpreadsheet, Trash2 } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Song } from '../types';

interface LikedSongsFullOverlayProps {
  lang: string;
  songs: Song[];
  onClose: () => void;
  onClear: () => void;
}

export const LikedSongsFullOverlay: React.FC<LikedSongsFullOverlayProps> = ({ lang, songs, onClose, onClear }) => {
  const t = translations[lang as keyof typeof translations] || translations.en;
  const [expanded, setExpanded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
      m3u += `https://www.deezer.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}\n`;
    });
    downloadBlob(m3u, 'melodymatch_favorites.m3u', 'audio/x-mpegurl');
  };

  const handleDownloadCSV = () => {
    let csv = '﻿Interpret,Titel,Erscheinungsjahr,Deezer-Suche\n';
    songs.forEach(song => {
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const searchUrl = `https://www.deezer.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}`;
      csv += `${esc(song.artist)},${esc(song.title)},${esc(song.year)},${esc(searchUrl)}\n`;
    });
    downloadBlob(csv, 'melodymatch_favorites.csv', 'text/csv;charset=utf-8;');
  };

  const handleClear = () => {
    setConfirmClear(true);
  };

  const handleConfirmClear = () => {
    onClear();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '2rem 1.5rem 1.5rem',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '0.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <Heart size={26} fill="var(--danger)" style={{ color: 'var(--danger)' }} />
        </div>

        <h3 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
          {t.likedSongsFullTitle}
        </h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t.likedSongsFullMsg}
        </p>

        {/* Export & Clear toggle */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.25rem 0', marginBottom: expanded ? '0.75rem' : '1rem',
          }}
        >
          <span>{t.exportAndClear}</span>
          <ChevronDown
            size={14}
            style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className="option-button outline sm w-full justify-start"
              onClick={handleDownloadM3U}
              style={{ gap: '0.6rem', padding: '0.6rem 0.9rem' }}
            >
              <Download size={15} className="text-primary" />
              <span style={{ fontSize: '0.83rem' }}>{t.downloadM3U}</span>
            </button>
            <button
              type="button"
              className="option-button outline sm w-full justify-start"
              onClick={handleDownloadCSV}
              style={{ gap: '0.6rem', padding: '0.6rem 0.9rem' }}
            >
              <FileSpreadsheet size={15} className="text-success" />
              <span style={{ fontSize: '0.83rem' }}>{t.downloadCSV}</span>
            </button>
            {confirmClear ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                padding: '0.75rem', background: 'var(--body-bg)',
                border: '1px dashed var(--danger)', borderRadius: '12px',
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
                  {t.confirmClear}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="option-button outline sm"
                    style={{ minHeight: '32px', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                    onClick={() => setConfirmClear(false)}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    className="option-button danger sm"
                    style={{ minHeight: '32px', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                    onClick={handleConfirmClear}
                  >
                    {t.yesClear}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="option-button outline sm w-full justify-start"
                onClick={handleClear}
                style={{ gap: '0.6rem', padding: '0.6rem 0.9rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                <Trash2 size={15} />
                <span style={{ fontSize: '0.83rem' }}>{t.clearList}</span>
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className="option-button outline sm w-full"
          onClick={onClose}
          style={{ minHeight: '40px' }}
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
};
