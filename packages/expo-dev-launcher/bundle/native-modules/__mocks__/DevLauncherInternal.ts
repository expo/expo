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
export const addDeepLinkListener = jest.fn().mockImplementation(() => {
  return {
    remove: jest.fn(),
  };
});
export const copyToClipboardAsync = jest.fn().mockResolvedValue(null);
export const getRecentlyOpenedApps = jest.fn().mockResolvedValue([]);
export const getCrashReport = jest.fn().mockResolvedValue(null);
export const loadUpdate = jest.fn().mockResolvedValue(null);

export const updatesConfig = {
  appId: '123',
  runtimeVersion: '123',
  sdkVersion: '1',
  usesEASUpdates: true,
  updatesUrl: '123',
};

export const loadFontsAsync = jest.fn().mockResolvedValue(null);
export const consumeNavigationStateAsync = jest.fn().mockResolvedValue(null);
export const saveNavigationStateAsync = jest.fn().mockResolvedValue(null);
export const clearNavigationStateAsync = jest.fn().mockResolvedValue(null);
