import { env } from 'node:process';

import {
  createBundleUrlPath,
  getAsyncRoutesFromExpoConfig,
  getMetroDirectBundleOptions,
} from '../metroOptions';

describe(getMetroDirectBundleOptions, () => {
  it(`asserts unsupported options: using bytecode on web`, () => {
    expect(() =>
      getMetroDirectBundleOptions({
        bytecode: true,
        platform: 'web',
      } as any)
    ).toThrow(/Cannot use bytecode with the web platform/);
  });
  it(`asserts unsupported options: using bytecode without hermes`, () => {
    expect(() =>
      getMetroDirectBundleOptions({
        bytecode: true,
      } as any)
    ).toThrow(/Bytecode is only supported with the Hermes engine/);
  });

  it(`returns basic options`, () => {
    expect(
      getMetroDirectBundleOptions({
        mainModuleName: '/index.js',
        mode: 'development',
        platform: 'ios',
        baseUrl: '/foo/',
        isExporting: false,
        bytecode: false,
        reactCompiler: false,
      })
    ).toEqual({
      customResolverOptions: {},
      customTransformOptions: {
        baseUrl: '/foo/',
      },
      serializerOptions: {
        includeSourceMaps: undefined,
        excludeSource: false,
      },
      dev: true,
      entryFile: '/index.js',
      inlineSourceMap: false,
      minify: false,
      platform: 'ios',
      unstable_transformProfile: 'default',
      shallow: false,
    });
  });
  it(`injects source url if serializer options are provided`, () => {
    expect(
      getMetroDirectBundleOptions({
        mainModuleName: '/index.js',
        mode: 'development',
        platform: 'ios',
        serializerIncludeMaps: true,
        isExporting: false,
        bytecode: false,
        reactCompiler: false,
      })
    ).toEqual({
      sourceUrl:
        'http://localhost:8081/index.js.bundle?platform=ios&dev=true&hot=false&serializer.map=true',
      customResolverOptions: {},
      customTransformOptions: {},
      serializerOptions: {
        includeSourceMaps: true,
        excludeSource: false,
      },
      sourceMapUrl:
        'http://localhost:8081/index.js.map?platform=ios&dev=true&hot=false&serializer.map=true',
      dev: true,
      entryFile: '/index.js',
      inlineSourceMap: false,
      minify: false,
      platform: 'ios',
      unstable_transformProfile: 'default',
      shallow: false,
    });
  });
  describe(`live bindings`, () => {
    afterEach(() => {
      delete env.EXPO_UNSTABLE_LIVE_BINDINGS;
    });
    it(`enables live bindings by default`, () => {
      expect(
        getMetroDirectBundleOptions({} as any).customTransformOptions?.liveBindings
      ).toBeUndefined();
    });
    it(`enables live bindings by default`, () => {
      env.EXPO_UNSTABLE_LIVE_BINDINGS = 'true';
      expect(
        getMetroDirectBundleOptions({} as any).customTransformOptions?.liveBindings
      ).toBeUndefined();
    });
    it(`enables live bindings by default`, () => {
      env.EXPO_UNSTABLE_LIVE_BINDINGS = '0';
      expect(getMetroDirectBundleOptions({} as any).customTransformOptions?.liveBindings).toBe(
        'false'
      );
    });
  });
});
describe(createBundleUrlPath, () => {
  it(`returns basic options`, () => {
    expect(
      createBundleUrlPath({
        mainModuleName: 'index',
        mode: 'development',
        platform: 'ios',
        isExporting: false,
      })
    ).toEqual('/index.bundle?platform=ios&dev=true&hot=false');
  });
  it(`returns basic options with baseUrl as a fully qualified URL`, () => {
    expect(
      createBundleUrlPath({
        mainModuleName: 'index',
        mode: 'development',
        platform: 'ios',
        baseUrl: 'https://localhost:8081/dist/',
        isExporting: false,
      })
    ).toEqual(
      '/index.bundle?platform=ios&dev=true&hot=false&transform.baseUrl=https%3A%2F%2Flocalhost%3A8081%2Fdist%2F'
    );
  });
  it(`disables lazy when exporting`, () => {
    expect(
      createBundleUrlPath({
        mainModuleName: 'index',
        mode: 'development',
        platform: 'ios',
        lazy: true,
        isExporting: true,
      })
    ).toEqual('/index.bundle?platform=ios&dev=true&hot=false&resolver.exporting=true');
  });
});

describe(getAsyncRoutesFromExpoConfig, () => {
  const expWithAsyncRoutes = (asyncRoutes: unknown) =>
    ({ name: 'app', slug: 'app', extra: { router: { asyncRoutes } } }) as any;

  it.each([
    // SDK 58 default from the `expo-router` config plugin: web-only.
    [{ web: true }, 'development', 'web', true],
    [{ web: true }, 'production', 'web', true],
    [{ web: true }, 'development', 'ios', false],
    [{ web: true }, 'production', 'ios', false],
    [{ web: true }, 'production', 'android', false],
    // Explicit platform values take precedence over `default`.
    [{ ios: 'development', web: true }, 'development', 'ios', true],
    [{ ios: 'development', web: true }, 'development', 'android', false],
    [{ default: true }, 'development', 'android', true],
    [{ default: true, web: false }, 'production', 'web', false],
    // Scalar values apply to every platform.
    [true, 'development', 'ios', true],
    [true, 'production', 'web', true],
    ['development', 'development', 'android', true],
    ['development', 'production', 'web', false],
    ['production', 'production', 'web', true],
    ['production', 'development', 'web', false],
    [false, 'development', 'web', false],
    [undefined, 'development', 'web', false],
  ] as const)(
    'resolves asyncRoutes=%j in %s for %s to %s',
    (asyncRoutes, mode, platform, expected) => {
      expect(getAsyncRoutesFromExpoConfig(expWithAsyncRoutes(asyncRoutes), mode, platform)).toBe(
        expected
      );
    }
  );

  it.each([
    [true, 'ios'],
    [true, 'android'],
    ['production', 'ios'],
    [{ default: true }, 'android'],
    [{ ios: true }, 'ios'],
    [{ ios: 'production' }, 'ios'],
  ] as const)(
    'never enables production async routes on native (asyncRoutes=%j, platform=%s)',
    (asyncRoutes, platform) => {
      expect(
        getAsyncRoutesFromExpoConfig(expWithAsyncRoutes(asyncRoutes), 'production', platform)
      ).toBe(false);
    }
  );
});
