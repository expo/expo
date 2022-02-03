import * as React from 'react';

import { BuildInfo, getBuildInfoAsync } from '../native-modules/DevMenu';

const BuildInfoContext = React.createContext<BuildInfo | null>(null);

export const useBuildInfo = () => React.useContext(BuildInfoContext);

export type BuildInfoContextProviderProps = {
  children: React.ReactNode;
  initialBuildInfo?: BuildInfo;
};

const emptyBuildInfo: BuildInfo = {
  appIcon: '',
  appName: '',
  appVersion: '',
  sdkVersion: '',
  runtimeVersion: '',
  hostUrl: '',
};

export function BuildInfoContextProvider({
  children,
  initialBuildInfo = emptyBuildInfo,
}: BuildInfoContextProviderProps) {
  const [buildInfo, setBuildInfo] = React.useState<BuildInfo>(initialBuildInfo);

  React.useEffect(() => {
    getBuildInfoAsync().then(setBuildInfo);
  }, []);

  return <BuildInfoContext.Provider value={buildInfo}>{children}</BuildInfoContext.Provider>;
}
