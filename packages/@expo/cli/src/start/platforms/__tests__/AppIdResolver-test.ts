import { getConfig } from '@expo/config';

import { AppIdResolver } from '../AppIdResolver';

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

function createAppIdResolver() {
  return new AppIdResolver('/', 'ios', 'foo.bar');
}

describe('getAppIdAsync', () => {
  it('resolves the app id from native files', async () => {
    const resolver = createAppIdResolver();
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.getAppIdFromNativeAsync = jest.fn(async () => 'dev.bacon.myapp');

    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromNativeAsync).toHaveBeenCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toHaveBeenCalledTimes(1);
  });
  it('throws when the app id is missing in native files', async () => {
    const resolver = createAppIdResolver();
    resolver.hasNativeProjectAsync = jest.fn(async () => true);
    resolver.resolveAppIdFromNativeAsync = jest.fn(() => null);
    await expect(resolver.getAppIdAsync()).rejects.toThrow(
      /Failed to locate the ios application identifier/
    );
    expect(resolver.resolveAppIdFromNativeAsync).toHaveBeenCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toHaveBeenCalledTimes(1);
  });
  it('resolves the app id from project config', async () => {
    const resolver = createAppIdResolver();
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);

    jest.mocked(getConfig).mockReturnValueOnce({
      exp: {
        foo: {
          bar: 'dev.bacon.myapp',
        },
      },
    } as any);
    expect(await resolver.getAppIdAsync()).toBe('dev.bacon.myapp');
    expect(resolver.getAppIdFromConfigAsync).toHaveBeenCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toHaveBeenCalledTimes(1);
  });
  it('throws when the app id is missing in the project config and there are no native files', async () => {
    const resolver = createAppIdResolver();
    resolver.hasNativeProjectAsync = jest.fn(async () => false);
    resolver.getAppIdFromConfigAsync = jest.fn(resolver.getAppIdFromConfigAsync);
    jest.mocked(getConfig).mockReturnValueOnce({
      exp: {},
    } as any);
    await expect(resolver.getAppIdAsync()).rejects.toThrow(/foo\.bar.*app\.json/);
    expect(resolver.getAppIdFromConfigAsync).toHaveBeenCalledTimes(1);
    expect(resolver.hasNativeProjectAsync).toHaveBeenCalledTimes(1);
  });
});
