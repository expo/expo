import * as React from 'react';

import {
  getRecentlyOpenedApps,
  clearRecentlyOpenedApps,
} from '../native-modules/DevLauncherInternal';

export type RecentApp = {
  url: string;
  name: string;
  timestamp: number;
};

type RecentlyOpenedApps = {
  recentApps: RecentApp[];
  setRecentApps: (recentApps: RecentApp[]) => void;
};

const Context = React.createContext<RecentlyOpenedApps | null>(null);

type RecentlyOpenedAppsProviderProps = {
  children: React.ReactNode;
  initialApps?: RecentApp[];
};

export function RecentlyOpenedAppsProvider({
  children,
  initialApps = [],
}: RecentlyOpenedAppsProviderProps) {
  const [recentApps, setRecentApps] = React.useState<RecentApp[]>(initialApps);

  return <Context.Provider value={{ recentApps, setRecentApps }}>{children}</Context.Provider>;
}

export function useRecentlyOpenedApps() {
  const [error, setError] = React.useState('');
  const [isFetching, setIsFetching] = React.useState(false);
  const { recentApps, setRecentApps } = React.useContext(Context);

  React.useEffect(() => {
    setIsFetching(true);
    getRecentlyOpenedApps()
      .then((apps) => {
        const recentApps = {};

        for (const id in apps) {
          const app = apps[id];
          recentApps[app?.name] = app;
        }

        setRecentApps(Object.values(recentApps));
        setIsFetching(false);
      })
      .catch((error) => {
        setIsFetching(false);
        setError(error.message);
        setRecentApps([]);
      });
  }, []);

  async function clear() {
    await clearRecentlyOpenedApps();
    setRecentApps([]);
  }

  return {
    data: recentApps,
    isFetching,
    error,
    clear,
  };
}
