import * as React from 'react';

import { BuildInfo, getBuildInfoAsync } from '../native-modules/DevMenu';

const BuildInfoContext = React.createContext<BuildInfo | null>(null);

export const useBuildInfo = () => React.useContext(BuildInfoContext);

export function BuildInfoContextProvider({ children }) {
  const [buildInfo, setBuildInfo] = React.useState<BuildInfo>({
    appIcon: '',
    appName: '',
    appVersion: '',
    sdkVersion: '',
    runtimeVersion: '',
    hostUrl: '',
  });

  React.useEffect(() => {
    getBuildInfoAsync().then(setBuildInfo);
  }, []);

  return <BuildInfoContext.Provider value={buildInfo}>{children}</BuildInfoContext.Provider>;
}
