import * as React from 'react';

import { DevLauncher } from '../native-modules/DevLauncher';
import * as DevMenu from '../native-modules/DevMenu';

// TODO - this would be better suited as an event emitter subscriber

const defaultDevSettings: DevMenu.DevSettings = {
  isElementInspectorShown: false,
  isHotLoadingEnabled: false,
  isPerfMonitorShown: false,
  isElementInspectorAvailable: true,
  isHotLoadingAvailable: true,
  isPerfMonitorAvailable: true,
  isJSInspectorAvailable: false,
};

const DevSettingsContext = React.createContext<DevMenu.DevSettings | undefined>(defaultDevSettings);

export type DevSettingsProviderProps = {
  children: React.ReactNode;
  devSettings?: DevMenu.DevSettings;
};

export function DevSettingsProvider({ children, devSettings }: DevSettingsProviderProps) {
  return <DevSettingsContext.Provider value={devSettings}>{children}</DevSettingsContext.Provider>;
}

export function useDevSettings() {
  const initialDevSettings = React.useContext(DevSettingsContext);

  const [devSettings, setDevSettings] = React.useState<DevMenu.DevSettings>(
    initialDevSettings || defaultDevSettings
  );

  React.useEffect(() => {
    if (initialDevSettings) {
      setDevSettings(initialDevSettings);
    }
  }, [initialDevSettings]);

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
    DevMenu.closeMenu();
  }, []);

  const toggleFastRefresh = React.useCallback(async () => {
    eagerToggleValue('isHotLoadingEnabled');
    await DevMenu.toggleFastRefreshAsync();
    DevMenu.closeMenu();
  }, []);

  const togglePerformanceMonitor = React.useCallback(async () => {
    eagerToggleValue('isPerfMonitorShown');
    await DevMenu.togglePerformanceMonitorAsync();
    DevMenu.closeMenu();
  }, []);

  const navigateToLauncher = React.useCallback(async () => {
    await DevLauncher.navigateToLauncherAsync();
    DevMenu.closeMenu();
  }, []);

  const reload = React.useCallback(async () => {
    await DevMenu.reloadAsync();
    DevMenu.closeMenu();
  }, []);

  const openRNDevMenu = React.useCallback(async () => {
    DevMenu.openDevMenuFromReactNative();
  }, []);

  const openJSInspector = React.useCallback(async () => {
    await DevMenu.openJSInspector();
    DevMenu.closeMenu();
  }, []);

  return {
    devSettings,
    actions: {
      togglePerformanceMonitor,
      toggleElementInspector,
      toggleFastRefresh,
      reload,
      navigateToLauncher,
      openRNDevMenu,
      openJSInspector,
    },
  };
}
