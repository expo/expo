import type { ExpoConfig } from '@expo/config';
import { env } from 'node:process';

import {
  createBundleUrlPath,
  getAsyncRoutesFromExpoConfig,
  getChunkingStrategyFromExpoConfig,
  getMetroDirectBundleOptions,
  getMetroDirectBundleOptionsForExpoConfig,
} from '../metroOptions';

describe('chunking options', () => {
  it.each([
    { experiments: undefined, expectedStrategy: 'legacy' },
    { experiments: {}, expectedStrategy: 'legacy' },
    { experiments: { chunking: { mode: 'legacy' } }, expectedStrategy: 'legacy' },
    { experiments: { chunking: { mode: 'granular' } }, expectedStrategy: 'granular' },
    {
      experiments: { chunking: { mode: 'granular' }, reactServerComponentRoutes: true },
      expectedStrategy: 'legacy',
    },
    {
      experiments: { chunking: { mode: 'granular' }, reactServerFunctions: true },
      expectedStrategy: 'legacy',
    },
    {
      experiments: {
        chunking: { mode: 'granular' },
        reactServerComponentRoutes: true,
        reactServerFunctions: true,
      },
      expectedStrategy: 'legacy',
    },
  ] as const)('selects $expectedStrategy for $experiments', ({ experiments, expectedStrategy }) => {
    const result = getMetroDirectBundleOptionsForExpoConfig(
      '/app',
      {
        name: 'test',
        slug: 'test',
        experiments,
      },
      {
        mainModuleName: '/app/index.js',
        mode: 'production',
        platform: 'web',
        isExporting: true,
        splitChunks: true,
      }
    );
    expect(result.serializerOptions).toMatchObject({
      chunkingStrategy: expectedStrategy,
      splitChunks: true,
    });
  });

  it.each(['legacy', 'granular'] as const)(
    'keeps %s chunking independent of the async routes setting',
    (mode) => {
      const config = {
        name: 'test',
        slug: 'test',
        experiments: { chunking: { mode } } as ExpoConfig['experiments'],
        extra: { router: { asyncRoutes: false } },
      };
      expect(getChunkingStrategyFromExpoConfig(config)).toBe(mode);
      expect(getAsyncRoutesFromExpoConfig(config, 'production', 'web')).toBe(false);
    }
  );
});

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
