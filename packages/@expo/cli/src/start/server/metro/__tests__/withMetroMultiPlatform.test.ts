import { getBareExtensions } from '@expo/config/paths';
import { vol } from 'memfs';
import { ConfigT } from 'metro-config';
import { CustomResolutionContext } from 'metro-resolver/src';
import assert from 'node:assert';

import { shouldCreateVirtualCanary, shouldCreateVirtualShim } from '../externals';
import { getNodejsExtensions, withExtendedResolver } from '../withMetroMultiPlatform';

const asMetroConfig = (config: Partial<ConfigT> = {}): ConfigT => config as any;

class FailedToResolveNameError extends Error {
  extraPaths: string[] = [];

  readonly name = 'FailedToResolveNameError';

  constructor() {
    super('Failed to resolve name');
  }
}
jest.mock('metro-resolver', () => {
  const resolve = jest.fn(() => ({ type: 'empty' }));
  return {
    resolve,
  };
});

jest.mock('../externals', () => ({
  ...jest.requireActual('../externals'),
  shouldCreateVirtualCanary: jest.fn(() => false),
  shouldCreateVirtualShim: jest.fn(() => false),
}));

function getDefaultRequestContext(): CustomResolutionContext {
  return getResolverContext();
}

function getMetroBundlerGetter() {
  return jest.fn(() => {
    const transformFile = jest.fn();
    // @ts-expect-error
    transformFile.__patched = true;
    return {
      hasVirtualModule: jest.fn((path) => false),
      setVirtualModule: jest.fn(),
      transformFile,
    };
  });
}

const expectVirtual = (result: import('metro-resolver').Resolution, name: string) => {
  expect(result.type).toBe('sourceFile');
  assert(result.type === 'sourceFile');
  assert(/^\0/.test(result.filePath), 'Virtual files must start with null byte: \\0');
  expect(result.filePath).toBe(name);
};

function getResolverContext(
  context: Partial<CustomResolutionContext> = {}
): CustomResolutionContext {
  return {
    dev: true,
    extraNodeModules: {},
    mainFields: ['react-native', 'browser', 'main'],
    nodeModulesPaths: ['/node_modules'],
    preferNativePlatform: true,
    sourceExts: ['mjs', 'ts', 'tsx', 'js', 'jsx', 'json', 'css'],
    customResolverOptions: {},
    originModulePath: '/index.js',
    ...context,
  } as any;
}
function getNodeResolverContext({
  customResolverOptions,
  ...context
}: Partial<CustomResolutionContext> = {}): CustomResolutionContext {
  return {
    dev: true,
    extraNodeModules: {},
    mainFields: ['react-native', 'browser', 'main'],
    nodeModulesPaths: ['/node_modules'],
    preferNativePlatform: true,
    sourceExts: ['mjs', 'ts', 'tsx', 'js', 'jsx', 'json', 'css'],
    customResolverOptions: {
      environment: 'node',
      ...(customResolverOptions || {}),
    },
    originModulePath: '/index.js',
    ...context,
  } as any;
}

function getResolveFunc() {
  return require('metro-resolver').resolve;
}

describe(withExtendedResolver, () => {
  function mockMinFs() {
    vol.fromJSON(
      {
        'node_modules/@react-native/assets-registry/registry.js': '',
      },
      '/'
    );
  }
  afterEach(() => {
    vol.reset();
  });

  it(`resolves a file for web`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
      getMetroBundler: getMetroBundlerGetter(),
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'expo', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        extraNodeModules: {},
        mainFields: ['react-native', 'browser', 'main'],
        nodeModulesPaths: ['/node_modules'],
        preferNativePlatform: true,
        sourceExts: ['mjs', 'ts', 'tsx', 'js', 'jsx', 'json', 'css'],
        customResolverOptions: {},
        originModulePath: expect.anything(),
      }),
      'expo',
      platform
    );
  });

  it(`resolves against tsconfig baseUrl`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: { baseUrl: '/src', paths: { '/*': ['*'] } },
      isTsconfigPathsEnabled: true,
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);

    expect(getResolveFunc()).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        extraNodeModules: {},
        mainFields: ['react-native', 'browser', 'main'],
        preferNativePlatform: true,
      }),
      '/src/react-native',
      platform
    );
  });

  it(`resolves against tsconfig baseUrl without paths`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: { baseUrl: '/src' },
      isTsconfigPathsEnabled: true,
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);

    expect(getResolveFunc()).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        extraNodeModules: {},
        mainFields: ['react-native', 'browser', 'main'],
        preferNativePlatform: true,
      }),
      '/src/react-native',
      platform
    );
  });

  it(`does not alias react-native-web in initial resolution with baseUrl on web`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: { baseUrl: '/src', paths: { '/*': ['*'] } },
      isTsconfigPathsEnabled: true,
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        mainFields: ['browser', 'module', 'main'],
        preferNativePlatform: false,
      }),
      '/src/react-native',
      platform
    );
  });

  it(`resolves to react-native-web on web`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: {},
      isTsconfigPathsEnabled: false,
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        mainFields: ['browser', 'module', 'main'],
        preferNativePlatform: false,
      }),
      'react-native-web',
      platform
    );
  });

  it(`resolves to expo-asset/build/resolveAssetSource on web`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: {},
      isTsconfigPathsEnabled: false,
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(
      getDefaultRequestContext(),
      'react-native/Libraries/Image/resolveAssetSource',
      platform
    );

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        mainFields: ['browser', 'module', 'main'],
        preferNativePlatform: false,
      }),
      'expo-asset/build/resolveAssetSource',
      platform
    );
  });

  describe('development aliases', () => {
    [
      [
        'ios',
        '/Users/path/to/node_modules/react-native/Libraries/Renderer/shims/ReactNative.js',
        '../implementations/ReactNativeRenderer-prod',
      ],
      ['web', '/Users/path/to/expo/node_modules/react/index.js', './cjs/react.production.min.js'],
    ].forEach(([platform, originModulePath, targetModulePath]) => {
      it(`resolves production react files to empty when bundling for development: (platform: ${platform}, import: ${targetModulePath})`, async () => {
        mockMinFs();

        const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
          tsconfig: {},
          isTsconfigPathsEnabled: false,
        });

        modified.resolver.resolveRequest!(
          {
            ...getDefaultRequestContext(),
            dev: true,
            originModulePath,
          },
          targetModulePath,
          platform
        );

        expect(getResolveFunc()).not.toBeCalled();
      });
    });

    it(`does not mock native files on web`, async () => {
      mockMinFs();

      const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: false,
      });

      modified.resolver.resolveRequest!(
        {
          ...getDefaultRequestContext(),
          dev: false,
          originModulePath:
            '/Users/path/to/node_modules/react-native/Libraries/Renderer/shims/ReactNative.js',
        },
        '../implementations/ReactNativeRenderer-prod.js',
        'web'
      );

      expect(getResolveFunc()).toBeCalled();
    });

    it(`resolves production react files normally when bundling for production`, async () => {
      mockMinFs();

      const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: false,
      });

      modified.resolver.resolveRequest!(
        {
          ...getDefaultRequestContext(),
          dev: false,
          originModulePath: '/Users/path/to/expo/node_modules/react/index.js',
        },
        './cjs/react.production.min.js',
        'web'
      );

      expect(getResolveFunc()).toBeCalled();
    });
  });

  it(`resolves to @expo/vector-icons on any platform`, async () => {
    vol.fromJSON(
      {
        'node_modules/@react-native/assets-registry/registry.js': '',
        'node_modules/@expo/vector-icons/index.js': '',
      },
      '/'
    );

    ['ios', 'web'].forEach((platform) => {
      const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: false,
      });

      modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        'react-native-vector-icons',
        platform
      );

      expect(getResolveFunc()).toBeCalledWith(expect.anything(), '@expo/vector-icons', platform);
    });
  });

  it(`resolves nested imports to @expo/vector-icons on any platform`, async () => {
    vol.fromJSON(
      {
        'node_modules/@react-native/assets-registry/registry.js': '',
        'node_modules/@expo/vector-icons/index.js': '',
      },
      '/'
    );

    ['ios', 'web'].forEach((platform) => {
      const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: false,
      });

      modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        'react-native-vector-icons/FontAwesome',
        platform
      );

      expect(getResolveFunc()).toBeCalledWith(
        expect.anything(),
        '@expo/vector-icons/FontAwesome',
        platform
      );
    });
  });

  it(`does not alias react-native-vector-icons if @expo/vector-icons is not installed`, async () => {
    vol.fromJSON(
      {
        'node_modules/@react-native/assets-registry/registry.js': '',
      },
      '/'
    );

    ['ios', 'web'].forEach((platform) => {
      const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: true,
      });

      modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        'react-native-vector-icons',
        platform
      );

      expect(getResolveFunc()).toBeCalledWith(
        expect.anything(),
        'react-native-vector-icons',
        platform
      );
    });
  });

  it(`allows importing @expo/vector-icons`, async () => {
    vol.fromJSON(
      {
        'node_modules/@react-native/assets-registry/registry.js': '',
        'node_modules/@expo/vector-icons/index.js': '',
      },
      '/'
    );
    const platform = 'ios';
    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: {},
      isTsconfigPathsEnabled: true,
    });

    modified.resolver.resolveRequest!(getDefaultRequestContext(), '@expo/vector-icons', platform);
    expect(getResolveFunc()).toBeCalledWith(expect.anything(), '@expo/vector-icons', platform);
  });

  it(`resolves a node.js built-in as a shim on web`, async () => {
    mockMinFs();

    // Emulate throwing when the module doesn't exist...
    jest.mocked(getResolveFunc()).mockImplementationOnce(() => {
      throw new FailedToResolveNameError();
    });

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
    });

    const platform = 'web';

    expect(
      modified.resolver.resolveRequest!(getDefaultRequestContext(), 'node:path', platform)
    ).toEqual({
      type: 'empty',
    });

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        mainFields: ['browser', 'module', 'main'],
        preferNativePlatform: false,
      }),
      'node:path',
      platform
    );
  });

  it(`resolves a node.js built-in as a an installed module on web`, async () => {
    mockMinFs();

    // Emulate throwing when the module doesn't exist...
    jest.mocked(getResolveFunc()).mockImplementationOnce(() => {
      return {
        type: 'sourceFile',
        filePath: 'node_modules/path/index.js',
      };
    });

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
    });

    const platform = 'web';

    expect(
      modified.resolver.resolveRequest!(getDefaultRequestContext(), 'node:path', platform)
    ).toEqual({
      filePath: 'node_modules/path/index.js',
      type: 'sourceFile',
    });

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        nodeModulesPaths: ['/node_modules'],
        mainFields: ['browser', 'module', 'main'],
        preferNativePlatform: false,
      }),
      'node:path',
      platform
    );
  });

  it(`modifies resolution for Node.js environments`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(
      {
        ...getDefaultRequestContext(),
        customResolverOptions: {
          environment: 'node',
        },
      },
      'react-native',
      platform
    );

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        mainFields: ['main', 'module'],
        preferNativePlatform: false,
        // Moved mjs to the back
        sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'css'],
      }),
      'react-native-web',
      platform
    );
  });

  it(`modifies resolution for React Server environments`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
      getMetroBundler: getMetroBundlerGetter(),
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(
      {
        ...getDefaultRequestContext(),
        customResolverOptions: {
          environment: 'react-server',
        },
      },
      'react-foobar',
      platform
    );

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      {
        customResolverOptions: { environment: 'react-server' },
        dev: true,
        extraNodeModules: {},
        mainFields: ['react-native', 'main', 'module'],
        nodeModulesPaths: ['/node_modules'],
        originModulePath: '/index.js',
        preferNativePlatform: true,
        sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'css'],
        unstable_conditionNames: ['node', 'require', 'react-server', 'workerd'],
        unstable_conditionsByPlatform: {},
        unstable_enablePackageExports: true,
      },
      'react-foobar',
      platform
    );
  });
  it(`modifies resolution for React Server environments (web)`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
      getMetroBundler: getMetroBundlerGetter(),
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(
      {
        ...getDefaultRequestContext(),
        customResolverOptions: {
          environment: 'react-server',
        },
      },
      'react-foobar',
      platform
    );

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      {
        customResolverOptions: { environment: 'react-server' },
        dev: true,
        extraNodeModules: {},
        mainFields: ['main', 'module'],
        nodeModulesPaths: ['/node_modules'],
        originModulePath: '/index.js',
        preferNativePlatform: false,
        sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'css'],
        unstable_conditionNames: ['node', 'require', 'react-server', 'workerd'],
        unstable_conditionsByPlatform: {},
        unstable_enablePackageExports: true,
      },
      'react-foobar',
      platform
    );
  });
  it(`modifies resolution for Node.js environments (web + react-foobar)`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: null,
      isTsconfigPathsEnabled: false,
      getMetroBundler: getMetroBundlerGetter(),
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(
      {
        ...getDefaultRequestContext(),
        customResolverOptions: {
          environment: 'node',
        },
      },
      'react-foobar',
      platform
    );

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      {
        customResolverOptions: { environment: 'node' },
        dev: true,
        extraNodeModules: {},
        mainFields: ['main', 'module'],
        nodeModulesPaths: ['/node_modules'],
        originModulePath: '/index.js',
        preferNativePlatform: false,
        sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'css'],
        unstable_conditionNames: ['node', 'require'],
        unstable_conditionsByPlatform: {},
        unstable_enablePackageExports: true,
      },
      'react-foobar',
      platform
    );
  });

  it(`aliases react-native-web modules to virtual shims on web`, async () => {
    vol.fromJSON(
      {
        'node_modules/react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js': '',

        'node_modules/@react-native/assets-registry/registry.js': '',

        mock: '',
      },
      '/'
    );

    jest
      .mocked(shouldCreateVirtualShim)
      .mockClear()
      .mockImplementationOnce((path: string) =>
        path.includes('react-native-web/dist/cjs/exports') ? '/mock' : null
      );
    // Emulate throwing when the module doesn't exist...
    jest
      .mocked(getResolveFunc())
      .mockClear()
      .mockImplementationOnce(() => {
        return {
          type: 'sourceFile',
          filePath: '/node_modules/react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js',
        };
      });

    const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
      tsconfig: {},
      isTsconfigPathsEnabled: false,
      isReactCanaryEnabled: true,
      getMetroBundler: getMetroBundlerGetter(),
    });

    const result = modified.resolver.resolveRequest!(
      getDefaultRequestContext(),
      '/node_modules/react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js',
      'web'
    );

    expect(result).toEqual({
      filePath: '\0shim:react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js',
      type: 'sourceFile',
    });

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.anything(),
      '/node_modules/react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js',
      'web'
    );
  });

  describe('built-in externals', () => {
    function getModifiedConfig(props: { isExporting?: boolean } = {}) {
      return withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isExporting: props.isExporting,
        isTsconfigPathsEnabled: false,
        isReactCanaryEnabled: false,
        getMetroBundler: getMetroBundlerGetter(),
      });
    }

    describe('node server + development', () => {
      const config = getModifiedConfig();

      ['ios', 'web'].forEach((platform) => {
        describe(platform, () => {
          ['react/123', 'expo'].forEach((name) => {
            it(`does not extern ${name} to virtual node shim`, () => {
              const result = config.resolver.resolveRequest!(
                // Context
                getNodeResolverContext(),
                // Module
                name,
                // Platform
                platform
              );

              expect(result.type).toBe('empty');
              expect(getResolveFunc()).toBeCalledTimes(1);
            });
          });

          [
            'source-map-support',
            'source-map-support/register.js',
            'react',
            'react-native-helmet-async',
            '@radix-ui/accordion',
            '@babel/runtime/helpers/interopRequireDefault',
            'react-dom/server',
            'debug',
            'acorn-loose',
            'acorn',
            'css-in-js-utils/lib/escape',
            'hyphenate-style-name',
            'color',
            'color-string',
            'color-convert',
            'color-name',
            'fontfaceobserver',
            'fast-deep-equal',
            'query-string',
            'escape-string-regexp',
            'invariant',
            'postcss-value-parser',
            'memoize-one',
            'nullthrows',
            'strict-uri-encode',
            'decode-uri-component',
            'split-on-first',
            'filter-obj',
            'warn-once',
            'simple-swizzle',
            'is-arrayish',
            'inline-style-prefixer/index.js',
          ].forEach((name) => {
            it(`externs ${name} to virtual node shim`, () => {
              const result = config.resolver.resolveRequest!(
                // Context
                getNodeResolverContext(),
                // Module
                name,
                // Platform
                platform
              );

              expectVirtual(
                result,
                // Expected path
                `\0node:${name}`
              );

              expect(getResolveFunc()).toBeCalledTimes(0);
            });
          });

          it(`externs @babel/runtime/xxx subpaths `, () => {
            const result = config.resolver.resolveRequest!(
              getNodeResolverContext(),
              '@babel/runtime/xxx/foo.js',
              platform
            );

            expectVirtual(
              result,
              // Expected path
              '\0node:@babel/runtime/xxx/foo.js'
            );

            expect(getResolveFunc()).toBeCalledTimes(0);
          });
        });
      });
    });

    it(`does not extern source-map-support in server environments that are bundling for standalone exports`, async () => {
      const result = getModifiedConfig({ isExporting: true }).resolver.resolveRequest!(
        getNodeResolverContext({
          customResolverOptions: {
            exporting: true,
          },
        }),
        'source-map-support',
        'web'
      );

      expect(result).toEqual({
        type: 'empty',
      });

      expect(getResolveFunc()).toBeCalledTimes(1);
    });

    it(`does not extern source-map-support in client environment`, async () => {
      const result = getModifiedConfig().resolver.resolveRequest!(
        getResolverContext(),
        'source-map-support',
        'web'
      );

      expect(result).toEqual({
        type: 'empty',
      });

      expect(getResolveFunc()).toBeCalledTimes(1);
    });
  });

  it(`aliases React Native renderer modules to canaries on native`, async () => {
    vol.fromJSON(
      {
        'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js':
          '',

        'node_modules/@react-native/assets-registry/registry.js': '',

        mock: '',
      },
      '/'
    );

    ['ios', 'android'].forEach((platform) => {
      jest
        .mocked(shouldCreateVirtualCanary)
        .mockClear()
        .mockImplementationOnce((path: string) =>
          path.includes('Libraries/Renderer/implementations') ? '/mock' : null
        );
      // Emulate throwing when the module doesn't exist...
      jest
        .mocked(getResolveFunc())
        .mockClear()
        .mockImplementationOnce(() => {
          return {
            type: 'sourceFile',
            filePath:
              '/node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
          };
        });

      const modified = withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: false,
        isReactCanaryEnabled: true,
        getMetroBundler: getMetroBundlerGetter(),
      });

      const result = modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        '/node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
        platform
      );

      expect(result).toEqual({
        filePath: '/mock',
        type: 'sourceFile',
      });

      expect(getResolveFunc()).toBeCalledTimes(1);
      expect(getResolveFunc()).toBeCalledWith(
        expect.anything(),
        '/node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
        platform
      );
    });
  });

  describe('sticky resolutions', () => {
    const platform = 'ios';

    function getModifiedConfig() {
      return withExtendedResolver(asMetroConfig({ projectRoot: '/' }), {
        tsconfig: {},
        isTsconfigPathsEnabled: false,
        isReactCanaryEnabled: true,
        getMetroBundler: getMetroBundlerGetter() as any,
      });
    }

    it('resolves `react-native` as sticky module', () => {
      const modified = getModifiedConfig();

      // Ensure the sticky module can be resolved
      getResolveFunc().mockImplementationOnce((_context, moduleImport, _platform) => {
        assert(moduleImport === 'react-native/package.json');
        return { type: 'sourceFile', filePath: '/node_modules/react-native/package.json' };
      });

      // Resolve the sticky module
      modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);
      // Resolution 1 - resolve sticky path of `react-native`
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'react-native/package.json',
        platform
      );
      // Resolution 2 - resolve with the sticky path
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        '/node_modules/react-native',
        platform
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(2);

      // Reset the mock's call state
      getResolveFunc().mockClear();
      // Resolve the sticky module again
      modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);
      // Resolution 1 - resolve with the cached sticky path
      expect(getResolveFunc()).toHaveBeenCalledWith(
        expect.any(Object),
        '/node_modules/react-native',
        platform
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(1);
    });

    it('resolves `@react-native/assets-registry` as sticky module', () => {
      const modified = getModifiedConfig();

      // Ensure the sticky module can be resolved, asset registry relies on react native
      getResolveFunc()
        .mockImplementationOnce((_context, moduleImport, _platform) => {
          assert(moduleImport === 'react-native/package.json');
          return { type: 'sourceFile', filePath: '/node_modules/react-native/package.json' };
        })
        .mockImplementationOnce((_context, moduleImport, _platform) => {
          assert(moduleImport === '@react-native/assets-registry/package.json');
          return {
            type: 'sourceFile',
            filePath:
              '/node_modules/react-native/node_modules/@react-native/assets-registry/package.json',
          };
        });

      // Resolve the sticky module
      modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        '@react-native/assets-registry/registry',
        platform
      );
      // Resolution 1 - resolve sticky path of `react-native`, which is used for `@react-native/assets-registry`
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'react-native/package.json',
        platform
      );
      // Resolution 2 - resolve sticky path of `@react-native/assets-registry/registry`
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ originModulePath: '/node_modules/react-native/package.json' }),
        '@react-native/assets-registry/package.json',
        platform
      );
      // Resolution 3 - resolve with the sticky path
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        '/node_modules/react-native/node_modules/@react-native/assets-registry/registry',
        platform
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(3);

      // Reset the mock's call state
      getResolveFunc().mockClear();
      // Resolve the sticky module again
      modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        '@react-native/assets-registry/registry',
        platform
      );
      // Resolution 1 - resolve with the cached sticky path
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        '/node_modules/react-native/node_modules/@react-native/assets-registry/registry',
        platform
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(1);
    });

    it('resolves `react-native-web..modules/AssetsRegistry` as `@react-native/assets-registry` sticky module', () => {
      const modified = getModifiedConfig();

      // Ensure the sticky module can be resolved, asset registry relies on react native
      getResolveFunc()
        .mockImplementationOnce((_context, moduleImport, _platform) => {
          expect(moduleImport).toBe('react-native/package.json');
          return { type: 'sourceFile', filePath: '/node_modules/react-native/package.json' };
        })
        .mockImplementationOnce((_context, moduleImport, _platform) => {
          expect(moduleImport).toBe('@react-native/assets-registry/package.json');
          return {
            type: 'sourceFile',
            filePath:
              '/node_modules/react-native/node_modules/@react-native/assets-registry/package.json',
          };
        });

      // Resolve the sticky module
      modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        'react-native-web/dist/cjs/modules/AssetRegistry',
        'web'
      );
      // Resolution 1 - resolve sticky path of `react-native`, which is used for `@react-native/assets-registry`
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'react-native/package.json',
        'web'
      );
      // Resolution 2 - resolve sticky path of `@react-native/assets-registry/registry`
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ originModulePath: '/node_modules/react-native/package.json' }),
        '@react-native/assets-registry/package.json',
        'web'
      );
      // Resolution 3 - resolve with the sticky path
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        3,
        expect.any(Object),
        '/node_modules/react-native/node_modules/@react-native/assets-registry/registry',
        'web'
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(3);
    });

    it('does not reuse failed sticky resolutions', () => {
      const modified = getModifiedConfig();

      // Let the first sticky resolution fail (by not returning a source file)
      getResolveFunc().mockImplementationOnce((_context, moduleImport, _platform) => ({
        type: 'empty',
      }));
      // Attempt to resolve the sticky module
      modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);
      // Resolution 1 - resolve sticky path of `react-native`, which fails
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'react-native/package.json',
        platform
      );
      // Resolution 2 - resolve normally, without the unresolved sticky path
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        'react-native',
        platform
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(2);

      // Reset the mock's call state
      getResolveFunc().mockClear();
      // Let the sticky resolution succeed
      getResolveFunc().mockImplementationOnce((_context, moduleImport, _platform) => {
        assert(moduleImport === 'react-native/package.json');
        return { type: 'sourceFile', filePath: '/node_modules/react-native/package.json' };
      });
      // Attempt to resolve the sticky module again, using the same resolver instance
      modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);
      // Resolution 1 - resolve sticky path of `react-native`, which succeeds
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'react-native/package.json',
        platform
      );
      // Resolution 2 - resolve with the sticky path
      expect(getResolveFunc()).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        '/node_modules/react-native',
        platform
      );
      // Ensure no other calls were made
      expect(getResolveFunc()).toHaveBeenCalledTimes(2);
    });
  });
});

describe(getNodejsExtensions, () => {
  it(`should return the correct extensions for the node.js platform`, () => {
    const sourceExts = getBareExtensions([], { isTS: true, isReact: true, isModern: true });

    expect(getNodejsExtensions(sourceExts)).not.toEqual(sourceExts);

    // Ensure mjs comes after js
    expect(getNodejsExtensions(sourceExts)).toMatchInlineSnapshot(`
      [
        "ts",
        "tsx",
        "js",
        "jsx",
        "mjs",
        "json",
      ]
    `);
  });
});
