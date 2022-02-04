import * as React from 'react';

import { AppInfo, getAppInfoAsync } from '../native-modules/DevMenu';

const AppInfoContext = React.createContext<AppInfo | null>(null);

export const useAppInfo = () => React.useContext(AppInfoContext);

export type AppInfoContextProviderProps = {
  children: React.ReactNode;
  initialAppInfo?: AppInfo;
};

const emptyAppInfo: AppInfo = {
  appIcon: '',
  appName: '',
  appVersion: '',
  sdkVersion: '',
  runtimeVersion: '',
  hostUrl: '',
};

export function AppInfoContextProvider({
  children,
  initialAppInfo = emptyAppInfo,
}: AppInfoContextProviderProps) {
  const [appInfo, setAppInfo] = React.useState<AppInfo>(initialAppInfo);

  React.useEffect(() => {
    getAppInfoAsync().then(setAppInfo);
  }, []);

  return <AppInfoContext.Provider value={appInfo}>{children}</AppInfoContext.Provider>;
}
