import * as React from 'react';

import { AppInfo } from '../native-modules/DevMenu';

const AppInfoContext = React.createContext<AppInfo | null>(null);

export const useAppInfo = () => React.useContext(AppInfoContext);

export type AppInfoContextProviderProps = {
  children: React.ReactNode;
  appInfo?: AppInfo;
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
  appInfo = emptyAppInfo,
}: AppInfoContextProviderProps) {
  return <AppInfoContext.Provider value={appInfo}>{children}</AppInfoContext.Provider>;
}
