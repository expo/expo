import os from 'os';

import {
  createLaunchBrowser,
  findSupportedBrowserTypeAsync,
  launchInspectorBrowserAsync,
} from '../LaunchBrowser';
import {
  type LaunchBrowser,
  type LaunchBrowserTypes,
  LaunchBrowserTypesEnum,
} from '../LaunchBrowser.types';
import LaunchBrowserImplMacOS from '../LaunchBrowserImplMacOS';

jest.mock('os', () => ({
  ...jest.requireActual<typeof os>('os'),
  platform: jest.fn().mockReturnValue('darwin'),
}));
jest.mock('../LaunchBrowserImplMacOS');

describe(createLaunchBrowser, () => {
  it('should return LaunchBrowser instance based on current host platform', () => {
    expect(createLaunchBrowser()).toBeInstanceOf(LaunchBrowserImplMacOS);
  });

  it('should throw error if no host platform is supported', () => {
    jest.spyOn(os, 'platform').mockReturnValueOnce('freebsd');
    expect(() => createLaunchBrowser()).toThrowError(/Unsupported host platform/);
  });
});

describe(findSupportedBrowserTypeAsync, () => {
  const launchBrowser = createLaunchBrowser();
  const supportedBrowsers = Object.values(LaunchBrowserTypesEnum);

  afterEach(() => {
    jest.spyOn(LaunchBrowserImplMacOS.prototype, 'isSupportedBrowser').mockReset();
  });

  it('should return supported browserType', async () => {
    jest
      .spyOn(LaunchBrowserImplMacOS.prototype, 'isSupportedBrowser')
      .mockImplementation(async (type) => type === 'Microsoft Edge');

    const browserType = await findSupportedBrowserTypeAsync(launchBrowser);
    expect(browserType).toBe('Microsoft Edge');
  });

  it('should throw error if no supported browsers on current platform', async () => {
    jest.spyOn(LaunchBrowserImplMacOS.prototype, 'isSupportedBrowser').mockResolvedValue(false);

    await expect(findSupportedBrowserTypeAsync(launchBrowser)).rejects.toThrowError(
      new RegExp(`${supportedBrowsers.join(', ')}`, 'i')
    );
  });
});

describe(launchInspectorBrowserAsync, () => {
  const browserMock: LaunchBrowser = {
    close: jest.fn(),
    createTempBrowserDir: jest.fn(),
    launchAsync: jest.fn(),
    isSupportedBrowser: jest.fn(),
  };

  it('should launch browser if supported', async () => {
    const browserType: LaunchBrowserTypes = 'Microsoft Edge';
    browserMock.isSupportedBrowser = jest.fn((type) => Promise.resolve(type === browserType));

    await launchInspectorBrowserAsync('url', browserMock, browserType);

    expect(browserMock.launchAsync).toHaveBeenCalledWith(browserType, expect.any(Array));
  });
});
