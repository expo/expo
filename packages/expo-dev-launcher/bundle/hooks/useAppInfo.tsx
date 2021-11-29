import * as React from 'react';

import { AppInfo } from '../native-modules/DevLauncherInternal';

type AppInfoContext = AppInfo & {
  setAppName: (appName: string) => void;
  setAppVersion: (appVersion: number) => void;
  setAppIcon: (appIcon: string) => void;
  setHostUrl: (hostUrl: string) => void;
};

const Context = React.createContext<AppInfoContext | null>(null);
export const useAppInfo = () => React.useContext(Context);

type AppInfoProviderProps = {
  children: React.ReactNode;
  initialAppInfo?: AppInfo;
};

export function AppInfoProvider({ children, initialAppInfo }: AppInfoProviderProps) {
  const [appName, setAppName] = React.useState(initialAppInfo?.appName ?? '');
  const [appVersion, setAppVersion] = React.useState(initialAppInfo?.appVersion ?? 0);
  const [appIcon, setAppIcon] = React.useState(initialAppInfo?.appIcon ?? '');
  const [hostUrl, setHostUrl] = React.useState(initialAppInfo?.hostUrl ?? '');

  return (
    <Context.Provider
      value={{
        appName,
        setAppName,
        appVersion,
        setAppVersion,
        appIcon,
        setAppIcon,
        hostUrl,
        setHostUrl,
      }}>
      {children}
    </Context.Provider>
  );
}
