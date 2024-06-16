import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';

import { AppleAppIdResolver } from '../AppleAppIdResolver';

jest.mock('@expo/config-plugins', () => ({
  IOSConfig: {
    BundleIdentifier: {
      getBundleIdentifierFromPbxproj: jest.fn(),
    },
    Paths: {
      getAllPBXProjectPaths: jest.fn(() => '/path/to/file'),
    },
  },
}));

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

// Most cases are tested in the superclass.

describe('hasNativeProjectAsync', () => {
  it(`returns true when the AppDelegate file exists`, async () => {
    jest.mocked(IOSConfig.Paths.getAllPBXProjectPaths).mockReturnValueOnce(['/path/to/file']);
    const resolver = new AppleAppIdResolver('/');
    expect(await resolver.hasNativeProjectAsync()).toBe(true);
  });
  it(`returns false when the AppDelegate getter throws`, async () => {
    jest.mocked(IOSConfig.Paths.getAllPBXProjectPaths).mockImplementationOnce(() => {
      throw new Error('file missing');
    });
    const resolver = new AppleAppIdResolver('/');
    expect(await resolver.hasNativeProjectAsync()).toBe(false);
  });
});

describe('getAppIdAsync', () => {
  it('resolves the app id from native files', async () => {
    const resolver = new AppleAppIdResolver('/');
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    jest
      .mocked(IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj)
      .mockReturnValueOnce('dev.bacon.myapp');
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });

  it('resolves the app id from project config', async () => {
    const resolver = new AppleAppIdResolver('/');
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);
    jest.mocked(getConfig).mockReturnValueOnce({
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
});
