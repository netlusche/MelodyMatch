import { useEffect, useRef } from 'react';

export const useWakeLock = (active: boolean) => {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const request = async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Denied or not supported — silently ignore
    }
  };

  const release = () => {
    lockRef.current?.release();
    lockRef.current = null;
  };

  useEffect(() => {
    if (active) {
      request();
    } else {
      release();
    }
    return () => { release(); };
  }, [active]);

  // Re-request after tab becomes visible again (Wake Lock is auto-released on hide)
  useEffect(() => {
    if (!active) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [active]);
};
