import React from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { ShareBar } from './ShareBar';
import { AppFooter } from './AppFooter';

export const LandingScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;

  return (
    <div className="screen landing-screen fade-in">
      <div className="landing-logo-wrap">
        <img
          src="/pwa-512.png"
          alt="MelodyMatch Logo"
          className="landing-logo"
          width={160}
          height={160}
        />
      </div>

      <h1 className="title-gradient landing-title">MelodyMatch</h1>
      <p className="landing-tagline">{t.tagline}</p>

      <button
        className="option-button primary large w-full landing-cta"
        onClick={() => dispatch({ type: 'GO_TO_SETUP' })}
      >
        {t.letsPlay}
      </button>

      <div className="landing-share">
        <span className="landing-share-label">{t.shareGame}</span>
        <ShareBar
          lang={state.lang}
          shareText={t.shareText}
          copyLabel={t.copyLink}
          copiedLabel={t.copied}
          shareLabel={t.shareGame}
        />
      </div>

      <AppFooter />
    </div>
  );
};
