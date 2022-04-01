import * as React from 'react';

import { EXUpdatesConfig, updatesConfig } from '../native-modules/DevLauncherInternal';

const Context = React.createContext<EXUpdatesConfig | null>(null);
export const useUpdatesConfig = () => React.useContext(Context);

type UpdatesConfigProviderProps = {
  children: React.ReactNode;
  initialUpdatesConfig?: EXUpdatesConfig;
};

export function UpdatesConfigProvider({ children }: UpdatesConfigProviderProps) {
  return <Context.Provider value={updatesConfig}>{children}</Context.Provider>;
}
