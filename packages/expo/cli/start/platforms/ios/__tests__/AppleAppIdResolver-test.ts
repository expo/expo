import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';

import { AppleAppIdResolver } from '../AppleAppIdResolver';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('@expo/config-plugins', () => ({
  IOSConfig: {
    BundleIdentifier: {
      getBundleIdentifierFromPbxproj: jest.fn(),
    },
    Paths: {
      getAppDelegateFilePath: jest.fn(),
    },
  },
}));

jest.mock('@expo/config', () => ({
  getProjectConfigDescriptionWithPaths: jest.fn(() => 'app.json'),
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

describe('getAppIdAsync', () => {
  beforeEach(() => {
    asMock(getConfig).mockReset();
  });
  it('resolves the app id from native files', async () => {
    const projectRoot = '/';
    const resolver = new AppleAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    asMock(IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj).mockReturnValueOnce(
      'dev.bacon.myapp'
    );
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
  it('throws when the app id is missing in native files', async () => {
    const projectRoot = '/';
    const resolver = new AppleAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    asMock(IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj).mockReturnValueOnce(null);
    await expect(resolver.getAppIdAsync()).rejects.toThrowError(
      /Failed to locate the ios application identifier/
    );
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
  it('resolves the app id from project config', async () => {
    const projectRoot = '/';
    const resolver = new AppleAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);

    asMock(getConfig).mockReturnValueOnce({
      exp: {
        ios: {
          bundleIdentifier: 'dev.bacon.myapp',
        },
      },
    } as any);
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromConfigAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
  it('throws when the app id is missing in the project config and there are no native files', async () => {
    const projectRoot = '/';
    const resolver = new AppleAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);
    asMock(getConfig).mockReturnValueOnce({
      exp: {},
    } as any);
    await expect(resolver.getAppIdAsync()).rejects.toThrowError(/ios\.bundleIdentifier/);
    expect(resolver.getAppIdFromConfigAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
});
