import * as React from 'react';

import { BuildInfo } from '../native-modules/DevLauncherInternal';

const Context = React.createContext<BuildInfo | null>(null);
export const useBuildInfo = () => React.useContext(Context);

type BuildInfoProviderProps = {
  children: React.ReactNode;
  initialBuildInfo?: BuildInfo;
};

const defaultBuildInfo: BuildInfo = {
  appName: '',
  appVersion: '',
  appIcon: '',
  sdkVersion: '',
  runtimeVersion: '',
};

export function BuildInfoProvider({
  children,
  initialBuildInfo = defaultBuildInfo,
}: BuildInfoProviderProps) {
  return (
    <Context.Provider value={{ ...defaultBuildInfo, ...initialBuildInfo }}>
      {children}
    </Context.Provider>
  );
}
