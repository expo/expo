import * as React from 'react';

import {
  EXUpdatesConfig,
  updatesConfig as initialUpdatesConfig,
} from '../native-modules/DevLauncherInternal';

const defaultUpdatesConfig: EXUpdatesConfig = {
  runtimeVersion: '',
  sdkVersion: '',
  appId: '',
  usesEASUpdates: false,
  projectUrl: '',
};

const Context = React.createContext<EXUpdatesConfig>(defaultUpdatesConfig);
export const useUpdatesConfig = () => React.useContext(Context);

type UpdatesConfigProviderProps = {
  children: React.ReactNode;
  initialUpdatesConfig?: EXUpdatesConfig;
};

type SetUpdatesConfigContext = (config: Partial<EXUpdatesConfig>) => void;
const SetConfigContext = React.createContext<SetUpdatesConfigContext>(() => {});

export const useSetUpdatesConfig = () => React.useContext(SetConfigContext);

export function UpdatesConfigProvider({ children }: UpdatesConfigProviderProps) {
  const [updatesConfig, setUpdatesConfig] = React.useState(initialUpdatesConfig);

  function onSetUpdatesConfig(updates: Partial<EXUpdatesConfig>) {
    setUpdatesConfig((previousConfig) => {
      return {
        ...previousConfig,
        ...updates,
      };
    });
  }

  return (
    <SetConfigContext.Provider value={onSetUpdatesConfig}>
      <Context.Provider value={updatesConfig}>{children}</Context.Provider>
    </SetConfigContext.Provider>
  );
}
