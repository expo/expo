export const getRecentlyOpenedApps = jest.fn();
export const loadApp = jest.fn();
export const getPendingDeepLink = jest.fn();
export const openCamera = jest.fn();
export const addDeepLinkListener = jest.fn();
export const clientUrlScheme = '123';
export const getAppInfoAsync = jest.fn().mockResolvedValue({
  appName: '',
  appVersion: 1,
  appIcon: '',
  hostUrl: '',
});
