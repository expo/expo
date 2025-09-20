// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { getPackageJson } from '@expo/config';
import { getBareExtensions, getMetroServerRoot } from '@expo/config/paths';
import JsonFile from '@expo/json-file';
import type { Reporter } from '@expo/metro/metro';
import type { Graph, Result as GraphResult } from '@expo/metro/metro/DeltaBundler/Graph';
import type {
  MixedOutput,
  Module,
  ReadOnlyGraph,
  Options as GraphOptions,
} from '@expo/metro/metro/DeltaBundler/types';
import { stableHash } from '@expo/metro/metro-cache';
import type { ConfigT as MetroConfig, InputConfigT } from '@expo/metro/metro-config';
import chalk from 'chalk';
import os from 'os';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getDefaultCustomizeFrame, INTERNAL_CALLSITES_REGEX } from './customizeFrame';
import { env } from './env';
import { FileStore } from './file-store';
import { getModulesPaths } from './getModulesPaths';
import { getWatchFolders } from './getWatchFolders';
import { getRewriteRequestUrl } from './rewriteRequestUrl';
import { JSModule } from './serializer/getCssDeps';
import { isVirtualModule } from './serializer/sideEffects';
import { withExpoSerializers } from './serializer/withExpoSerializers';
import { getPostcssConfigHash } from './transform-worker/postcss';
import { toPosixPath } from './utils/filePath';
import { setOnReadonly } from './utils/setOnReadonly';

const debug = require('debug')('expo:metro:config') as typeof console.log;

export interface LoadOptions {
  config?: string;
  maxWorkers?: number;
  port?: number;
  reporter?: Reporter;
  resetCache?: boolean;
}

export interface DefaultConfigOptions {
  /** @deprecated */
  mode?: 'exotic';
  /**
   * **Experimental:** Enable CSS support for Metro web, and shim on native.
   *
   * This is an experimental feature and may change in the future. The underlying implementation
   * is subject to change, and native support for CSS Modules may be added in the future during a non-major SDK release.
   */
  isCSSEnabled?: boolean;

  /**
   * **Experimental:** Modify premodules before a code asset is serialized
   *
   * This is an experimental feature and may change in the future. The underlying implementation
   * is subject to change.
   */
  unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
    graph: ReadOnlyGraph<MixedOutput>;
    premodules: Module[];
    debugId?: string;
  }) => Module[])[];
}

let hasWarnedAboutExotic = false;
let hasWarnedAboutReactNative = false;

// Patch Metro's graph to support always parsing certain modules. This enables
// things like Tailwind CSS which update based on their own heuristics.
function patchMetroGraphToSupportUncachedModules() {
  const {
    Graph,
  }: typeof import('@expo/metro/metro/DeltaBundler/Graph') = require('@expo/metro/metro/DeltaBundler/Graph');

  interface TraverseDependencies {
    (paths: readonly string[], options: GraphOptions<any>): Promise<GraphResult<any>>;
    __patched?: boolean;
  }

  const original_traverseDependencies = Graph.prototype
    .traverseDependencies as TraverseDependencies;

  if (!original_traverseDependencies.__patched) {
    original_traverseDependencies.__patched = true;
    // eslint-disable-next-line no-inner-declarations
    function traverseDependencies(this: Graph, paths: string[], options: GraphOptions<any>) {
      this.dependencies.forEach((dependency: Module | JSModule) => {
        // Find any dependencies that have been marked as `skipCache` and ensure they are invalidated.
        // `skipCache` is set when a CSS module is found by PostCSS.
        if (
          dependency.output.find((file) => file.data.css?.skipCache) &&
          !paths.includes(dependency.path)
        ) {
          // Ensure we invalidate the `unstable_transformResultKey` (input hash) so the module isn't removed in
          // the Graph._processModule method.
          setOnReadonly(
            dependency,
            'unstable_transformResultKey',
            dependency.unstable_transformResultKey + '.'
          );

          // Add the path to the list of modified paths so it gets run through the transformer again,
          // this will ensure it is passed to PostCSS -> Tailwind.
          paths.push(dependency.path);
        }
      });
      // Invoke the original method with the new paths to ensure the standard behavior is preserved.
      return original_traverseDependencies.call(this, paths, options);
    }
    // Ensure we don't patch the method twice.
    Graph.prototype.traverseDependencies = traverseDependencies;
    traverseDependencies.__patched = true;
  }
}

function createNumericModuleIdFactory(): (path: string) => number {
  const fileToIdMap = new Map();
  let nextId = 0;
  return (modulePath: string) => {
    let id = fileToIdMap.get(modulePath);
    if (typeof id !== 'number') {
      id = nextId++;
      fileToIdMap.set(modulePath, id);
    }
    return id;
  };
}

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export function createStableModuleIdFactory(
  root: string
): (path: string, context?: { platform: string; environment?: string }) => number {
  const getModulePath = (modulePath: string, scope: string) => {
    // NOTE: Metro allows this but it can lead to confusing errors when dynamic requires cannot be resolved, e.g. `module 456 cannot be found`.
    if (modulePath == null) {
      return 'MODULE_NOT_FOUND';
    } else if (isVirtualModule(modulePath)) {
      // Virtual modules should be stable.
      return modulePath;
    } else if (path.isAbsolute(modulePath)) {
      return toPosixPath(path.relative(root, modulePath)) + scope;
    } else {
      return toPosixPath(modulePath) + scope;
    }
  };

  const memoizedGetModulePath = memoize(getModulePath);

  // This is an absolute file path.
  // TODO: We may want a hashed version for production builds in the future.
  return (modulePath: string, context?: { platform: string; environment?: string }): number => {
    const env = context?.environment ?? 'client';

    if (env === 'client') {
      // Only need scope for server bundles where multiple dimensions could run simultaneously.
      // @ts-expect-error: we patch this to support being a string.
      return memoizedGetModulePath(modulePath, '');
    }

    // Helps find missing parts to the patch.
    if (!context?.platform) {
      // context = { platform: 'web' };
      throw new Error('createStableModuleIdFactory: `context.platform` is required');
    }

    // Only need scope for server bundles where multiple dimensions could run simultaneously.
    const scope = env !== 'client' ? `?platform=${context?.platform}&env=${env}` : '';
    // @ts-expect-error: we patch this to support being a string.
    return memoizedGetModulePath(modulePath, scope);
  };
}

export function getDefaultConfig(
  projectRoot: string,
  { mode, isCSSEnabled = true, unstable_beforeAssetSerializationPlugins }: DefaultConfigOptions = {}
): InputConfigT {
  const {
    getDefaultConfig: getDefaultMetroConfig,
    mergeConfig,
  }: typeof import('@expo/metro/metro-config') = require('@expo/metro/metro-config');

  if (isCSSEnabled) {
    patchMetroGraphToSupportUncachedModules();
  }

  const isExotic = mode === 'exotic' || env.EXPO_USE_EXOTIC;

  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(
      chalk.gray(
        `\u203A Feature ${chalk.bold`EXPO_USE_EXOTIC`} has been removed in favor of the default transformer.`
      )
    );
  }

  const reactNativePath = path.dirname(
    resolveFrom.silent(projectRoot, 'react-native/package.json') ?? 'react-native/package.json'
  );
  if (reactNativePath === 'react-native' && !hasWarnedAboutReactNative) {
    hasWarnedAboutReactNative = true;
    console.log(
      chalk.yellow(
        `\u203A Could not resolve react-native! Is it installed and a project dependency?`
      )
    );
  }

  const sourceExtsConfig = { isTS: true, isReact: true, isModern: true };
  const sourceExts = getBareExtensions([], sourceExtsConfig);

  // Add support for cjs (without platform extensions).
  sourceExts.push('cjs');

  const reanimatedVersion = getPkgVersion(projectRoot, 'react-native-reanimated');
  const workletsVersion = getPkgVersion(projectRoot, 'react-native-worklets');
  const babelRuntimeVersion = getPkgVersion(projectRoot, '@babel/runtime');

  let sassVersion: string | null = null;
  if (isCSSEnabled) {
    sassVersion = getPkgVersion(projectRoot, 'sass');
    // Enable SCSS by default so we can provide a better error message
    // when sass isn't installed.
    sourceExts.push('scss', 'sass', 'css');
  }

  let pkg: ReturnType<typeof getPackageJson> | undefined;
  try {
    pkg = getPackageJson(projectRoot);
  } catch (error: any) {
    if (error && error.name === 'ConfigError') {
      console.log(
        chalk.yellow(`\u203A Could not find a package.json at the project root! ("${projectRoot}")`)
      );
    } else {
      throw error;
    }
  }

  const watchFolders = getWatchFolders(projectRoot);
  const nodeModulesPaths = getModulesPaths(projectRoot);
  if (env.EXPO_DEBUG) {
    console.log();
    console.log(`Expo Metro config:`);
    try {
      console.log(`- Version: ${require('../package.json').version}`);
    } catch {}
    console.log(`- Extensions: ${sourceExts.join(', ')}`);
    console.log(`- React Native: ${reactNativePath}`);
    console.log(`- Watch Folders: ${watchFolders.join(', ')}`);
    console.log(`- Node Module Paths: ${nodeModulesPaths.join(', ')}`);
    console.log(`- Sass: ${sassVersion}`);
    console.log(`- Reanimated: ${reanimatedVersion}`);
    console.log(`- Worklets: ${workletsVersion}`);
    console.log(`- Babel Runtime: ${babelRuntimeVersion}`);
    console.log();
  }

  const {
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter,
    ...metroDefaultValues
  } = getDefaultMetroConfig.getDefaultValues(projectRoot);

  const cacheStore = new FileStore<any>({
    root: path.join(os.tmpdir(), 'metro-cache'),
  });

  const serverRoot = getMetroServerRoot(projectRoot);

  const routerPackageRoot = resolveFrom.silent(projectRoot, 'expo-router');
  // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
  // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
  const metroConfig: Partial<MetroConfig> = mergeConfig(metroDefaultValues, {
    watchFolders,
    resolver: {
      unstable_conditionsByPlatform: {
        ios: ['react-native'],
        android: ['react-native'],
        // This is removed for server platforms.
        web: ['browser'],
      },
      resolverMainFields: ['react-native', 'browser', 'main'],
      platforms: ['ios', 'android'],
      assetExts: metroDefaultValues.resolver.assetExts
        .concat(
          // Add default support for `expo-image` file types.
          ['heic', 'avif'],
          // Add default support for `expo-sqlite` file types.
          ['db']
        )
        .filter((assetExt: string) => !sourceExts.includes(assetExt)),
      sourceExts,
      nodeModulesPaths,
    },
    cacheStores: [cacheStore],
    watcher: {
      // strip starting dot from env files. We only support watching development variants of env files as production is inlined using a different system.
      additionalExts: ['env', 'local', 'development'],
    },
    serializer: {
      isThirdPartyModule(module) {
        // Block virtual modules from appearing in the source maps.
        if (isVirtualModule(module.path)) return true;

        // Generally block node modules
        if (/(?:^|[/\\])node_modules[/\\]/.test(module.path)) {
          // Allow the expo-router/entry and expo/AppEntry modules to be considered first party so the root of the app appears in the trace.
          return !module.path.match(/[/\\](expo-router[/\\]entry|expo[/\\]AppEntry)/);
        }
        return false;
      },

      createModuleIdFactory: env.EXPO_USE_METRO_REQUIRE
        ? createStableModuleIdFactory.bind(null, serverRoot)
        : createNumericModuleIdFactory,

      getModulesRunBeforeMainModule: () => {
        const preModules: string[] = [
          // MUST be first
          require.resolve(path.join(reactNativePath, 'Libraries/Core/InitializeCore')),
        ];

        const stdRuntime = resolveFrom.silent(projectRoot, 'expo/src/winter/index.ts');
        if (stdRuntime) {
          preModules.push(stdRuntime);
        } else {
          debug('"expo/src/winter" not found, this may cause issues');
        }

        // We need to shift this to be the first module so web Fast Refresh works as expected.
        // This will only be applied if the module is installed and imported somewhere in the bundle already.
        const metroRuntime = getExpoMetroRuntimeOptional(projectRoot);
        if (metroRuntime) {
          preModules.push(metroRuntime);
        } else {
          debug('"@expo/metro-runtime" not found, this may cause issues');
        }

        return preModules;
      },
      getPolyfills: ({ platform }) => {
        // Do nothing for nullish platforms.
        if (!platform) {
          return [];
        }

        // Native behavior.
        return require(path.join(reactNativePath, 'rn-get-polyfills'))();
      },
    },
    server: {
      rewriteRequestUrl: getRewriteRequestUrl(projectRoot),
      port: Number(env.RCT_METRO_PORT) || 8081,
      // NOTE(EvanBacon): Moves the server root down to the monorepo root.
      // This enables proper monorepo support for web.
      unstable_serverRoot: serverRoot,
    },
    symbolicator: {
      customizeFrame: getDefaultCustomizeFrame(),
    },
    transformerPath: require.resolve('./transform-worker/transform-worker'),
    // NOTE: All of these values are used in the cache key. They should not contain any absolute paths.
    transformer: {
      // Custom: These are passed to `getCacheKey` and ensure invalidation when the version changes.
      unstable_renameRequire: false,
      // @ts-expect-error: not on type.
      _expoRouterPath: routerPackageRoot ? path.relative(serverRoot, routerPackageRoot) : undefined,
      postcssHash: getPostcssConfigHash(projectRoot),
      browserslistHash: pkg?.browserslist
        ? stableHash(JSON.stringify(pkg?.browserslist)).toString('hex')
        : null,
      sassVersion,
      // Ensure invalidation when the version changes due to the Reanimated and Worklets Babel plugins.
      reanimatedVersion,
      workletsVersion,
      // Ensure invalidation when using identical projects in monorepos
      _expoRelativeProjectRoot: path.relative(serverRoot, projectRoot),
      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: require.resolve('./babel-transformer'),
      // TODO: The absolute path invalidates caching across devices. To account for this, we remove the `asyncRequireModulePath` from the cache key but that means any changes to the file will not invalidate the cache.
      asyncRequireModulePath: require.resolve('./async-require'),
      assetRegistryPath: '@react-native/assets-registry/registry',
      // Determines the minimum version of `@babel/runtime`, so we default it to the project's installed version of `@babel/runtime`
      enableBabelRuntime: babelRuntimeVersion ?? undefined,
      // hermesParser: true,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: true,
          inlineRequires: false,
        },
      }),
    },
  });

  return withExpoSerializers(metroConfig, { unstable_beforeAssetSerializationPlugins });
}

/** Use to access the Expo Metro transformer path */
export const unstable_transformerPath = require.resolve('./transform-worker/transform-worker');
export const internal_supervisingTransformerPath = require.resolve(
  './transform-worker/supervising-transform-worker'
);

// re-export for use in config files.
export { MetroConfig, INTERNAL_CALLSITES_REGEX };

// re-export for legacy cases.
export const EXPO_DEBUG = env.EXPO_DEBUG;

function getPkgVersion(projectRoot: string, pkgName: string): string | null {
  const targetPkg = resolveFrom.silent(projectRoot, pkgName);
  if (!targetPkg) return null;
  const targetPkgJson = findUpPackageJson(targetPkg);
  if (!targetPkgJson) return null;
  const pkg = JsonFile.read(targetPkgJson);

  debug(`${pkgName} package.json:`, targetPkgJson);
  const pkgVersion = pkg.version;
  if (typeof pkgVersion === 'string') {
    return pkgVersion;
  }

  return null;
}

function findUpPackageJson(cwd: string): string | null {
  if (['.', path.sep].includes(cwd)) return null;

  const found = resolveFrom.silent(cwd, './package.json');
  if (found) {
    return found;
  }
  return findUpPackageJson(path.dirname(cwd));
}

function getExpoMetroRuntimeOptional(projectRoot: string): string | undefined {
  const EXPO_METRO_RUNTIME = '@expo/metro-runtime';
  let metroRuntime = resolveFrom.silent(projectRoot, EXPO_METRO_RUNTIME);
  if (!metroRuntime) {
    // NOTE(@kitten): While `@expo/metro-runtime` is a peer, auto-installing this peer is valid and expected
    // When it's auto-installed it may not be hoisted or not accessible from the project root, so we need to
    // try to also resolve it via `expo-router`, where it's a required peer
    const baseExpoRouter = resolveFrom.silent(projectRoot, 'expo-router/package.json');
    // When expo-router isn't installed, however, we instead try to resolve it from `expo`, where it's an
    // optional peer dependency
    metroRuntime = baseExpoRouter
      ? resolveFrom.silent(baseExpoRouter, EXPO_METRO_RUNTIME)
      : resolveFrom.silent(require.resolve('expo/package.json'), EXPO_METRO_RUNTIME);
  }
  return metroRuntime;
}
