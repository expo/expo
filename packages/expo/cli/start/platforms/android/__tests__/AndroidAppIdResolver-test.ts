import { getConfig } from '@expo/config';
import { AndroidConfig } from '@expo/config-plugins';

import { AndroidAppIdResolver } from '../AndroidAppIdResolver';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('@expo/config-plugins', () => ({
  AndroidConfig: {
    Package: {
      getApplicationIdAsync: jest.fn(),
    },
    Paths: {
      getProjectPathOrThrowAsync: jest.fn(),
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
    const resolver = new AndroidAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    asMock(AndroidConfig.Package.getApplicationIdAsync).mockResolvedValueOnce('dev.bacon.myapp');
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
  it('throws when the app id is missing in native files', async () => {
    const projectRoot = '/';
    const resolver = new AndroidAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(resolver.getAppIdFromNativeAsync);
    asMock(AndroidConfig.Package.getApplicationIdAsync).mockResolvedValueOnce(null);
    await expect(resolver.getAppIdAsync()).rejects.toThrowError(
      /Failed to locate the android application identifier/
    );
    expect(resolver.getAppIdFromNativeAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
  it('resolves the app id from project config', async () => {
    const projectRoot = '/';
    const resolver = new AndroidAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);

    asMock(getConfig).mockReturnValueOnce({
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
  it('throws when the app id is missing in the project config and there are no native files', async () => {
    const projectRoot = '/';
    const resolver = new AndroidAppIdResolver(projectRoot);
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);
    asMock(getConfig).mockReturnValueOnce({
      exp: {
        android: {},
      },
    } as any);
    await expect(resolver.getAppIdAsync()).rejects.toThrowError(/android\.package/);
    expect(resolver.getAppIdFromConfigAsync).toBeCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toBeCalledTimes(1);
  });
});
