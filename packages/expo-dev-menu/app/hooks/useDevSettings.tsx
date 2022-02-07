import * as React from 'react';

import * as DevMenu from '../native-modules/DevMenu';
import { useBottomSheet } from './useBottomSheet';

// TODO - this would be better suited as an event emitter subscriber

export function useDevSettings() {
  const bottomSheet = useBottomSheet();

  const [devSettings, setDevSettings] = React.useState<DevMenu.DevSettings>({
    isDebuggingRemotely: false,
    isElementInspectorShown: false,
    isHotLoadingEnabled: false,
    isPerfMonitorShown: false,
  });

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

  React.useEffect(() => {
    DevMenu.getDevSettingsAsync().then(setDevSettings);
  }, []);

  const updateSettings = React.useCallback(async () => {
    const updates = await DevMenu.getDevSettingsAsync();
    setDevSettings(updates);
  }, []);

  const toggleElementInspector = React.useCallback(async () => {
    eagerToggleValue('isElementInspectorShown');
    await DevMenu.toggleElementInspectorAsync();
    bottomSheet.collapse();
    updateSettings();
  }, []);

  const toggleFastRefresh = React.useCallback(async () => {
    eagerToggleValue('isHotLoadingEnabled');
    await DevMenu.toggleFastRefreshAsync();
    bottomSheet.collapse();
    updateSettings();
  }, []);

  const toggleDebugRemoteJS = React.useCallback(async () => {
    eagerToggleValue('isDebuggingRemotely');
    await DevMenu.toggleDebugRemoteJSAsync();
    bottomSheet.collapse();
    updateSettings();
  }, []);

  const togglePerformanceMonitor = React.useCallback(async () => {
    eagerToggleValue('isPerfMonitorShown');
    await DevMenu.togglePerformanceMonitorAsync();
    bottomSheet.collapse();
    updateSettings();
  }, []);

  const navigateToLauncher = React.useCallback(async () => {
    await DevMenu.navigateToLauncherAsync();
    updateSettings();
    bottomSheet.collapse();
  }, []);

  const reload = React.useCallback(async () => {
    await DevMenu.reloadAsync();
    bottomSheet.collapse();
    updateSettings();
  }, []);

  const closeMenu = React.useCallback(async () => {
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
      closeMenu,
    },
  };
}
