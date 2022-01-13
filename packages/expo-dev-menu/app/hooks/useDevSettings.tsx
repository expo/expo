import * as React from 'react';

import * as DevMenu from '../native-modules/DevMenu';

// TODO - this would be better suited as an event emitter subscriber

export function useDevSettings() {
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
    await DevMenu.toggleElementInspector();
    await updateSettings();
  }, []);

  const toggleFastRefresh = React.useCallback(async () => {
    await DevMenu.toggleFastRefresh();
    await updateSettings();
  }, []);

  const toggleDebugRemoteJS = React.useCallback(async () => {
    await DevMenu.toggleDebugRemoteJS();
    await updateSettings();
  }, []);

  const togglePerformanceMonitor = React.useCallback(async () => {
    await DevMenu.togglePerformanceMonitor();
    await updateSettings();
  }, []);

  return {
    devSettings,
    actions: {
      togglePerformanceMonitor,
      toggleDebugRemoteJS,
      toggleElementInspector,
      toggleFastRefresh,
    },
  };
}
