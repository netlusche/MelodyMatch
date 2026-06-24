import React from 'react';
import packageInfo from '../../package.json';

export const AppFooter: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    width: '100%',
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
    marginTop: '1rem',
    fontSize: '0.75rem',
    opacity: 0.6,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M4 10v10M9 6v14M14 12v8M19 8v12" />
      </svg>
      <span>Deezer API</span>
      <span style={{ marginInline: '0.2rem' }}>,</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <span>iTunes API</span>
      <span style={{ marginInline: '0.2rem' }}>&</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px', display: 'inline-block', verticalAlign: 'middle' }}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
      <span>MusicBrainz API</span>
    </div>
    <div>Non-commercial hobby project • v{packageInfo.version}</div>
  </div>
);
