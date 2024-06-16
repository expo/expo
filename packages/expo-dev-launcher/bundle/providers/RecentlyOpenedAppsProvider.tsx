import * as React from 'react';
import url from 'url';

import {
  getRecentlyOpenedApps,
  clearRecentlyOpenedApps,
} from '../native-modules/DevLauncherInternal';

type App = {
  id: string;
  url: string;
  name: string;
  timestamp: number;
};

export type RecentApp =
  | (App & {
      isEASUpdate: true;
      branchName: string;
      updateMessage: string;
    })
  | (App & { isEASUpdate: false });

type RecentlyOpenedApps = {
  recentApps: RecentApp[];
  setRecentApps: (recentApps: RecentApp[]) => void;
};

const Context = React.createContext<RecentlyOpenedApps>({
  recentApps: [],
  setRecentApps: () => {},
});

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
        // use a map to index apps by their url:
        const recentApps: { [id: string]: RecentApp } = {};
        let mostRecentLocalApp: RecentApp | undefined;

        for (const app of apps) {
          // index by url to eliminate multiple bundlers with the same address
          const id = `${app.url}`;
          app.id = id;

          // only show one app with local url
          if (isLocalAppURL(app)) {
            const previousTimestamp = mostRecentLocalApp?.timestamp ?? 0;

            if (app.timestamp > previousTimestamp) {
              mostRecentLocalApp = app;
            }
          } else {
            const previousTimestamp = recentApps[id]?.timestamp ?? 0;

            if (app.timestamp > previousTimestamp) {
              recentApps[id] = app;
            }
          }
        }

        // sorted by most recent timestamp first
        const recentAppsArray = Object.values(recentApps);
        if (mostRecentLocalApp) {
          recentAppsArray.push(mostRecentLocalApp);
        }
        const sortedByMostRecent = recentAppsArray.sort((a, b) => b.timestamp - a.timestamp);

        setRecentApps(sortedByMostRecent);
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

function isLocalAppURL(app: RecentApp) {
  const host = url.parse(app.url, true).host;

  return (
    host?.startsWith('192.168.') ||
    host?.startsWith('172.') ||
    host?.startsWith('10.') ||
    host?.startsWith('localhost:')
  );
}
