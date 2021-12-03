import * as React from 'react';

import { AppInfo } from '../native-modules/DevLauncherInternal';

const Context = React.createContext<AppInfo | null>(null);
export const useAppInfo = () => React.useContext(Context);

type AppInfoProviderProps = {
  children: React.ReactNode;
  initialAppInfo?: AppInfo;
};

const defaultAppInfo: AppInfo = {
  appName: '',
  appVersion: '',
  appIcon: '',
  sdkVersion: '',
  runtimeVersion: '',
};

export function AppInfoProvider({
  children,
  initialAppInfo = defaultAppInfo,
}: AppInfoProviderProps) {
  return (
    <Context.Provider value={{ ...defaultAppInfo, ...initialAppInfo }}>{children}</Context.Provider>
  );
}
