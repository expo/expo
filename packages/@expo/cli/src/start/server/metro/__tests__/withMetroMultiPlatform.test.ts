import { getBareExtensions } from '@expo/config/paths';
import { ConfigT } from 'metro-config';
import FailedToResolveNameError from 'metro-resolver/src/errors/FailedToResolveNameError';
import FailedToResolvePathError from 'metro-resolver/src/errors/FailedToResolvePathError';
import { vol, fs } from 'memfs';
import path from 'path';
const ModuleCache = jest.requireActual('metro/src/node-haste/ModuleCache');
import {
  getNodejsExtensions,
  shouldAliasAssetRegistryForWeb,
  withExtendedResolver,
} from '../withMetroMultiPlatform';
import { CustomResolutionContext, ResolutionContext } from 'metro-resolver/src';

const asMetroConfig = (config: Partial<ConfigT> = {}): ConfigT => config as any;
import { importMetroResolverFromProject } from '../resolveFromProject';

jest.mock('../resolveFromProject', () => {
  const resolve = jest.fn(() => ({ type: 'empty' }));
  return {
    importFromProject: jest.fn(),
    importMetroResolverFromProject: jest.fn(() => ({ resolve })),
  };
  // importMetroResolverFromProject: jest.fn(() => jest.requireActual('metro-resolver')),
});

function getDefaultRequestContext({
  unstable_enableSymlinks = false,
  assetResolutions = [],
}: {
  unstable_enableSymlinks?: boolean;
  assetResolutions?: string[];
} = {}): CustomResolutionContext {
  // function _getClosestPackage(filePath: string): string | null {
  //   const parsedPath = path.parse(filePath);
  //   const root = parsedPath.root;
  //   let dir = path.join(parsedPath.dir, parsedPath.base);

  //   do {
  //     // If we've hit a node_modules directory, the closest package was not
  //     // found (`filePath` was likely nonexistent).
  //     if (path.basename(dir) === 'node_modules') {
  //       return null;
  //     }
  //     const candidate = path.join(dir, 'package.json');
  //     if (fs.existsSync(candidate)) {
  //       return candidate;
  //     }
  //     dir = path.dirname(dir);
  //   } while (dir !== '.' && dir !== root);
  //   return null;
  // }

  return {
    // redirectModulePath: jest.requireActual('metro-resolver/src/PackageResolve').redirectModulePath,
    // dirExists: (filePath: string) => {
    //   try {
    //     return fs.lstatSync(filePath).isDirectory();
    //   } catch (e) {}
    //   return false;
    // },
    // disableHierarchicalLookup: true,
    // doesFileExist: (filepath) => fs.existsSync(filepath),
    // emptyModulePath: '/node_modules/metro-runtime/src/modules/empty-module.js',

    // getHasteModulePath: [Function: getHasteModulePath],
    // getHastePackagePath: [Function: getHastePackagePath],
    // isAssetFile: (filePath, assetExts) => {
    //   const baseName = path.basename(filePath);

    //   for (let i = baseName.length - 1; i >= 0; i--) {
    //     if (baseName[i] === '.') {
    //       const ext = baseName.slice(i + 1);

    //       if (assetExts.has(ext)) {
    //         return true;
    //       }
    //     }
    //   }
    //   return false;
    // },

    // moduleCache: new ModuleCache({
    //   getClosestPackage: (filePath) => _getClosestPackage(filePath),
    // }),

    // resolveAsset: (dirPath: string, assetName: string, extension: string) => {
    //   const basePath = dirPath + path.sep + assetName;
    //   let assets = [
    //     basePath + extension,
    //     ...assetResolutions.map((resolution) => basePath + '@' + resolution + 'x' + extension),
    //   ];

    //   if (unstable_enableSymlinks) {
    //     // @ts-expect-error
    //     assets = assets.map((candidate) => fs.realpathSync(candidate)).filter(Boolean);
    //   } else {
    //     assets = assets.filter((candidate) => fs.existsSync(candidate));
    //   }

    //   return assets.length ? assets : null;
    // },

    // resolveHasteModule: (name: string) => {
    //   const candidate = '/haste/' + name + '.js';
    //   if (fs.existsSync(candidate)) {
    //     return candidate;
    //   }

    //   return undefined;
    // },
    // resolveHastePackage: (name: string) => {
    //   const candidate = '/haste/' + name + '/package.json';
    //   if (fs.existsSync(candidate)) {
    //     return candidate;
    //   }
    //   return undefined;
    // },
    // getPackageMainPath: [Function: _getPackageMainPath],
    // allowHaste: true,
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
  return importMetroResolverFromProject('/').resolve;
}

describe(withExtendedResolver, () => {
  function mockMinFs() {
    vol.fromJSON(
      {
        'node_modules/react-native/Libraries/Image/AssetRegistry.js': '',
      },
      '/'
    );
  }
  afterEach(() => {
    vol.reset();
  });

  it(`resolves a file for web`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig(), {
      projectRoot: '/',
      platforms: ['ios', 'web'],
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
        getPackageMainPath: expect.any(Function),
      }),
      'react-native',
      platform
    );
  });

  it(`resolves against tsconfig baseUrl`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig(), {
      projectRoot: '/',
      platforms: ['ios', 'web'],
      tsconfig: { baseUrl: '/src', paths: { '/*': ['*'] } },
      isTsconfigPathsEnabled: true,
    });

    const platform = 'ios';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        nodeModulesPaths: ['/node_modules', '/src'],
        extraNodeModules: {},
        mainFields: ['react-native', 'browser', 'main'],
        preferNativePlatform: true,
      }),
      'react-native',
      platform
    );
  });

  it(`resolves to react-native-web on web`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig(), {
      projectRoot: '/',
      platforms: ['ios', 'web'],
      tsconfig: { baseUrl: '/src', paths: { '/*': ['*'] } },
      isTsconfigPathsEnabled: true,
    });

    const platform = 'web';

    modified.resolver.resolveRequest!(getDefaultRequestContext(), 'react-native', platform);

    expect(getResolveFunc()).toBeCalledTimes(1);
    expect(getResolveFunc()).toBeCalledWith(
      expect.objectContaining({
        nodeModulesPaths: ['/node_modules', '/src'],
        extraNodeModules: {
          'react-native': expect.stringContaining('node_modules/react-native-web'),
        },
        mainFields: ['browser', 'module', 'main'],
        preferNativePlatform: false,
      }),
      'react-native-web',
      platform
    );
  });

  it(`modifies resolution for Node.js environments`, async () => {
    mockMinFs();

    const modified = withExtendedResolver(asMetroConfig(), {
      projectRoot: '/',
      platforms: ['ios', 'web'],
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
        extraNodeModules: {
          'react-native': expect.stringContaining('node_modules/react-native-web'),
        },
        mainFields: ['main', 'module'],
        preferNativePlatform: false,
        // Moved mjs to the back
        sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'css'],
      }),
      'react-native-web',
      platform
    );
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
