export const hideMenu = jest.fn();
export const reloadAsync = jest.fn();
export const toggleDebugRemoteJSAsync = jest.fn();
export const toggleElementInspectorAsync = jest.fn();
export const toggleFastRefreshAsync = jest.fn();
export const togglePerformanceMonitorAsync = jest.fn();
export const copyToClipboardAsync = jest.fn().mockResolvedValue({});

export const subscribeToOpenEvents = jest.fn(() => {
  return {
    remove: () => {},
  };
});

export const subscribeToCloseEvents = jest.fn(() => {
  return {
    remove: () => {},
  };
});
