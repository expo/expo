export const loadApp = jest.fn().mockResolvedValue('');
export const clientUrlScheme = '123';
export const installationID = '';
export const isDevice = false;
export const getBuildInfoAsync = jest.fn().mockResolvedValue({
  appName: '',
  appVersion: 1,
  appIcon: '',
  hostUrl: '',
});
export const getPendingDeepLink = jest.fn().mockResolvedValue('');
export const addDeepLinkListener = jest.fn().mockImplementation(() => jest.fn());
export const copyToClipboardAsync = jest.fn().mockResolvedValue(null);
export const getRecentlyOpenedApps = jest.fn().mockResolvedValue([]);
export const getCrashReport = jest.fn().mockResolvedValue(null);
