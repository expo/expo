export const getRecentlyOpenedApps = jest.fn();
export const loadApp = jest.fn();
export const clientUrlScheme = '123';
export const getAppInfoAsync = jest.fn().mockResolvedValue({
  appName: '',
  appVersion: 1,
  appIcon: '',
  hostUrl: '',
});
export const getPendingDeepLink = jest.fn().mockResolvedValue('');
export const addDeepLinkListener = jest.fn().mockImplementation(() => jest.fn());
export const copyToClipboardAsync = jest.fn().mockResolvedValue(null);
