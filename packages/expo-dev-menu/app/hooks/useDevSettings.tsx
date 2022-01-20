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

  React.useEffect(() => {
    DevMenu.getDevSettingsAsync().then(setDevSettings);
  }, []);

  const updateSettings = React.useCallback(async () => {
    const updates = await DevMenu.getDevSettingsAsync();
    setDevSettings(updates);
  }, []);

  const toggleElementInspector = React.useCallback(async () => {
    await DevMenu.toggleElementInspectorAsync();
    bottomSheet.collapse();
    await updateSettings();
  }, []);

  const toggleFastRefresh = React.useCallback(async () => {
    await DevMenu.toggleFastRefreshAsync();
    bottomSheet.collapse();
    await updateSettings();
  }, []);

  const toggleDebugRemoteJS = React.useCallback(async () => {
    await DevMenu.toggleDebugRemoteJSAsync();
    bottomSheet.collapse();
    await updateSettings();
  }, []);

  const togglePerformanceMonitor = React.useCallback(async () => {
    await DevMenu.togglePerformanceMonitorAsync();
    bottomSheet.collapse();
    await updateSettings();
  }, []);

  const navigateToLauncher = React.useCallback(async () => {
    await DevMenu.navigateToLauncherAsync();
    bottomSheet.collapse();
    await updateSettings();
  }, []);

  const reload = React.useCallback(async () => {
    await DevMenu.reloadAsync();
    bottomSheet.collapse();
    await updateSettings();
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
