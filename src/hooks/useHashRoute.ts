// miZan — Hash Route Subscription Hook
import { useCallback, useEffect, useState } from 'react';
import { parseHashRoute, tabToHash, type TabRoute } from '../utils/routes';

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHashRoute(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHashRoute(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((tab: TabRoute) => {
    const targetHash = tabToHash(tab);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute({ tab, openCheckin: false });
    }
  }, []);

  const consumePendingCheckin = useCallback(() => {
    setRoute(prev => (prev.openCheckin ? { ...prev, openCheckin: false } : prev));
    if (window.location.hash === '#/checkin') {
      window.history.replaceState(null, '', '#/');
    }
  }, []);

  return {
    tab: route.tab,
    pendingCheckin: route.openCheckin,
    consumePendingCheckin,
    navigate,
  };
}
