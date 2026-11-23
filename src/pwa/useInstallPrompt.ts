// miZan — Unobtrusive PWA Install Prompt Hook (Chromium + iOS Safari)
import { useCallback, useEffect, useRef, useState } from 'react';

const DISMISSED_AT_KEY = 'mizan-install-dismissed-at';
const DISMISS_COUNT_KEY = 'mizan-install-dismiss-count';
const VISIT_COUNT_KEY = 'mizan-visit-count';
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_DISMISSALS = 3;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaStandalone || iosStandalone;
}

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isBannerSnoozed(): boolean {
  try {
    const count = Number(localStorage.getItem(DISMISS_COUNT_KEY) || '0');
    if (Number.isFinite(count) && count >= MAX_DISMISSALS) return true;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) || '0');
    if (Number.isFinite(dismissedAt) && dismissedAt > 0) {
      return Date.now() - dismissedAt < SNOOZE_MS;
    }
    return false;
  } catch {
    return false;
  }
}

function hasMultipleVisits(): boolean {
  try {
    const visits = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    return Number.isFinite(visits) && visits >= 2;
  } catch {
    return false;
  }
}

interface UseInstallPromptOptions {
  engaged: boolean;
  onInstalled?: () => void;
}

export function useInstallPrompt({ engaged, onInstalled }: UseInstallPromptOptions) {
  const [isStandalone, setIsStandalone] = useState(detectStandalone);
  const [isIos] = useState(detectIos);
  const [canPromptNative, setCanPromptNative] = useState(false);
  const [snoozed, setSnoozed] = useState(isBannerSnoozed);
  const [repeatVisit] = useState(hasMultipleVisits);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const onInstalledRef = useRef(onInstalled);

  useEffect(() => {
    onInstalledRef.current = onInstalled;
  }, [onInstalled]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPromptNative(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanPromptNative(false);
      setIsStandalone(true);
      onInstalledRef.current?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const canInstall = !isStandalone && (canPromptNative || isIos);
  const showBanner = canInstall && (engaged || repeatVisit) && !snoozed;

  const dismissBanner = useCallback(() => {
    setSnoozed(true);
    try {
      const prevCount = Number(localStorage.getItem(DISMISS_COUNT_KEY) || '0');
      const nextCount = Number.isFinite(prevCount) ? prevCount + 1 : 1;
      localStorage.setItem(DISMISS_COUNT_KEY, String(nextCount));
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> => {
    if (isStandalone) return 'unavailable';
    if (deferredPromptRef.current) {
      const promptEvent = deferredPromptRef.current;
      deferredPromptRef.current = null;
      setCanPromptNative(false);
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'dismissed') {
        dismissBanner();
      }
      return outcome;
    }
    if (isIos) {
      return 'ios';
    }
    return 'unavailable';
  }, [isStandalone, isIos, dismissBanner]);

  return {
    canInstall,
    showBanner,
    isIos,
    promptInstall,
    dismissBanner,
  };
}
