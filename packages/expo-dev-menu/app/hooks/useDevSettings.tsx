import * as React from 'react';

import { DevLauncher } from '../native-modules/DevLauncher';
import * as DevMenu from '../native-modules/DevMenu';
import { useBottomSheet } from './useBottomSheet';

// TODO - this would be better suited as an event emitter subscriber

const defaultDevSettings: DevMenu.DevSettings = {
  isDebuggingRemotely: false,
  isElementInspectorShown: false,
  isHotLoadingEnabled: false,
  isPerfMonitorShown: false,
  isElementInspectorAvailable: true,
  isHotLoadingAvailable: true,
  isPerfMonitorAvailable: true,
  isRemoteDebuggingAvailable: true,
};

const DevSettingsContext = React.createContext<DevMenu.DevSettings>(defaultDevSettings);

export type DevSettingsProviderProps = {
  children: React.ReactNode;
  devSettings?: DevMenu.DevSettings;
};

export function DevSettingsProvider({ children, devSettings }: DevSettingsProviderProps) {
  return <DevSettingsContext.Provider value={devSettings}>{children}</DevSettingsContext.Provider>;
}

export function useDevSettings() {
  const bottomSheet = useBottomSheet();
  const initialDevSettings = React.useContext(DevSettingsContext);

  const [devSettings, setDevSettings] = React.useState<DevMenu.DevSettings>(
    initialDevSettings || defaultDevSettings
  );

  // toggle value so that there is no lag in response to user input
  // these values will update to the correct value after the native fn is executed via updateSettings()
  // by this time the bottom sheet will likely be closed
  function eagerToggleValue(key: keyof DevMenu.DevSettings) {
    setDevSettings((prevSettings) => {
      return {
        ...prevSettings,
        [key]: !prevSettings[key],
      };
    });
  }

  const toggleElementInspector = React.useCallback(async () => {
    eagerToggleValue('isElementInspectorShown');
    await DevMenu.toggleElementInspectorAsync();
    bottomSheet.collapse();
  }, []);

  const toggleFastRefresh = React.useCallback(async () => {
    eagerToggleValue('isHotLoadingEnabled');
    await DevMenu.toggleFastRefreshAsync();
    bottomSheet.collapse();
  }, []);

  const toggleDebugRemoteJS = React.useCallback(async () => {
    eagerToggleValue('isDebuggingRemotely');
    await DevMenu.toggleDebugRemoteJSAsync();
    bottomSheet.collapse();
  }, []);

  const togglePerformanceMonitor = React.useCallback(async () => {
    eagerToggleValue('isPerfMonitorShown');
    await DevMenu.togglePerformanceMonitorAsync();
    bottomSheet.collapse();
  }, []);

  const navigateToLauncher = React.useCallback(async () => {
    await DevLauncher.navigateToLauncherAsync();
    bottomSheet.collapse();
  }, []);

  const reload = React.useCallback(async () => {
    await DevMenu.reloadAsync();
    bottomSheet.collapse();
  }, []);

  return {
    devSettings,
    actions: {
      togglePerformanceMonitor,
      toggleDebugRemoteJS,
      toggleElementInspector,
      toggleFastRefresh,
      reload,
      navigateToLauncher,
    },
  };
}
