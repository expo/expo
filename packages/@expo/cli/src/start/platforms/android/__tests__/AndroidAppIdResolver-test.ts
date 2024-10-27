import { getConfig } from '@expo/config';
import { AndroidConfig } from '@expo/config-plugins';

import { AndroidAppIdResolver } from '../AndroidAppIdResolver';

jest.mock('@expo/config-plugins', () => ({
  AndroidConfig: {
    Package: {
      getApplicationIdAsync: jest.fn(),
    },
    Paths: {
      getProjectPathOrThrowAsync: jest.fn(async () => '/path/to/file'),
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

describe('getAppIdAsync', () => {
  it('resolves the app id from native files', async () => {
    const resolver = new AndroidAppIdResolver('/');
    resolver.hasNativeProjectAsync = jest.fn(resolver.hasNativeProjectAsync);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    jest
      .mocked(AndroidConfig.Package.getApplicationIdAsync)
      .mockResolvedValueOnce('dev.bacon.myapp');
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });

  it('resolves the app id from project config', async () => {
    const resolver = new AndroidAppIdResolver('/');
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);

    jest.mocked(getConfig).mockReturnValueOnce({
      exp: {
        android: {
          package: 'dev.bacon.myapp',
        },
      },
    } as any);
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromConfigAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
});
