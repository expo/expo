import * as React from 'react';

import { EXUpdatesConfig } from '../native-modules/EXUpdates';

const Context = React.createContext<EXUpdatesConfig | null>(null);
export const useUpdatesConfig = () => React.useContext(Context);

type UpdatesConfigProviderProps = {
  children: React.ReactNode;
  initialUpdatesConfig?: EXUpdatesConfig;
};

const defaultUpdatesConfig: EXUpdatesConfig = {
  runtimeVersion: '',
  sdkVersion: '',
  appId: '',
  isEASUpdates: false,
};

export function UpdatesConfigProvider({
  children,
  initialUpdatesConfig = defaultUpdatesConfig,
}: UpdatesConfigProviderProps) {
  return (
    <Context.Provider value={{ ...defaultUpdatesConfig, ...initialUpdatesConfig }}>
      {children}
    </Context.Provider>
  );
}
