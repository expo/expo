import { getBareExtensions } from '@expo/config/paths';
import { vol } from 'memfs';
import { ConfigT } from 'metro-config';
import { CustomResolutionContext } from 'metro-resolver/src';

import {
  getNodejsExtensions,
  shouldAliasAssetRegistryForWeb,
  withExtendedResolver,
} from '../withMetroMultiPlatform';

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

function getDefaultRequestContext(): CustomResolutionContext {
  return {
    dev: true,
    extraNodeModules: {},
    mainFields: ['react-native', 'browser', 'main'],
    nodeModulesPaths: ['/node_modules'],
    preferNativePlatform: true,
    sourceExts: ['mjs', 'ts', 'tsx', 'js', 'jsx', 'json', 'css'],
    customResolverOptions: {},
    originModulePath: '/index.js',
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
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

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
      'react-native',
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
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(
      {
        ...getDefaultRequestContext(),
        customResolverOptions: {
          environment: 'react-server',
        },
      },
      'react-dom',
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
        preferNativePlatform: true,
        sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'css'],
        unstable_conditionNames: ['node', 'require', 'react-server', 'server'],
        unstable_conditionsByPlatform: {},
        unstable_enablePackageExports: true,
      },
      'react-dom',
      platform
    );
  });
  it(`modifies resolution for React Server environments (web)`, async () => {
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
          environment: 'react-server',
        },
      },
      'react-dom',
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
        unstable_conditionNames: ['node', 'require', 'react-server', 'server'],
        unstable_conditionsByPlatform: {},
        unstable_enablePackageExports: true,
      },
      'react-dom',
      platform
    );
  });
  it(`modifies resolution for Node.js environments (web + react-dom)`, async () => {
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
      'react-dom',
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
      'react-dom',
      platform
    );
  });

  it(`aliases React Native renderer modules to canaries on native`, async () => {
    vol.fromJSON(
      {
        'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js':
          '',
        '.expo/metro/canary/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js':
          '',
        'node_modules/@react-native/assets-registry/registry.js': '',
      },
      '/'
    );

    ['ios', 'android'].forEach((platform) => {
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
      });

      const result = modified.resolver.resolveRequest!(
        getDefaultRequestContext(),
        '/node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
        platform
      );

      expect(result).toEqual({
        filePath:
          '/.expo/metro/canary/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
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

describe(shouldAliasAssetRegistryForWeb, () => {
  it(`should return true if the incoming resolution is for the web platform and the AssetRegistry`, () => {
    [
      'node_modules/react-native-web/dist/modules/AssetRegistry/index.js',
      // Monorepo
      '../../react-native-web/dist/modules/AssetRegistry/index.js',
      // Windows
      'node_modules\\react-native-web\\dist\\modules\\AssetRegistry\\index.js',
    ].forEach((filePath) => {
      expect(
        shouldAliasAssetRegistryForWeb('web', {
          type: 'sourceFile',
          filePath,
        })
      ).toBe(true);
    });
  });
  it(`should return false if the path is wrong`, () => {
    ['modules/AssetRegistry/index.js', 'invalid'].forEach((filePath) => {
      expect(
        shouldAliasAssetRegistryForWeb('web', {
          type: 'sourceFile',
          filePath,
        })
      ).toBe(false);
    });
  });
  it(`should return false if the incoming resolution is for non-web platforms`, () => {
    [
      'invalid.js',

      // valid
      'node_modules/react-native-web/dist/modules/AssetRegistry/index.js',
    ].forEach((filePath) => {
      expect(
        shouldAliasAssetRegistryForWeb('ios', {
          type: 'sourceFile',
          filePath,
        })
      ).toBe(false);
    });
  });
});
