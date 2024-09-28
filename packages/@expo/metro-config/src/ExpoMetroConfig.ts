// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { getPackageJson } from '@expo/config';
import { getBareExtensions, getMetroServerRoot } from '@expo/config/paths';
import * as runtimeEnv from '@expo/env';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import { MixedOutput, Module, ReadOnlyGraph, Reporter } from 'metro';
import { stableHash } from 'metro-cache';
import { ConfigT as MetroConfig, InputConfigT } from 'metro-config';
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
import { importMetroConfig } from './traveling/metro-config';
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

function getAssetPlugins(projectRoot: string): string[] {
  const hashAssetFilesPath = resolveFrom.silent(projectRoot, 'expo-asset/tools/hashAssetFiles');

  if (!hashAssetFilesPath) {
    throw new Error(`The required package \`expo-asset\` cannot be found`);
  }

  return [
    // Use relative path to ensure maximum cache hits.
    // This is resolved here https://github.com/facebook/metro/blob/ec584b9cc2b8356356a4deacb7e1d5c83f243c3a/packages/metro/src/Assets.js#L271
    'expo-asset/tools/hashAssetFiles',
  ];
}

let hasWarnedAboutExotic = false;

// Patch Metro's graph to support always parsing certain modules. This enables
// things like Tailwind CSS which update based on their own heuristics.
function patchMetroGraphToSupportUncachedModules() {
  const { Graph } = require('metro/src/DeltaBundler/Graph');

  const original_traverseDependencies = Graph.prototype.traverseDependencies;
  if (!original_traverseDependencies.__patched) {
    original_traverseDependencies.__patched = true;

    Graph.prototype.traverseDependencies = function (paths: string[], options: unknown) {
      this.dependencies.forEach((dependency: JSModule) => {
        // Find any dependencies that have been marked as `skipCache` and ensure they are invalidated.
        // `skipCache` is set when a CSS module is found by PostCSS.
        if (
          dependency.output.find((file) => file.data.css?.skipCache) &&
          !paths.includes(dependency.path)
        ) {
          // Ensure we invalidate the `unstable_transformResultKey` (input hash) so the module isn't removed in
          // the Graph._processModule method.
          dependency.unstable_transformResultKey = dependency.unstable_transformResultKey + '.';

          // Add the path to the list of modified paths so it gets run through the transformer again,
          // this will ensure it is passed to PostCSS -> Tailwind.
          paths.push(dependency.path);
        }
      });
      // Invoke the original method with the new paths to ensure the standard behavior is preserved.
      return original_traverseDependencies.call(this, paths, options);
    };
    // Ensure we don't patch the method twice.
    Graph.prototype.traverseDependencies.__patched = true;
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

function createStableModuleIdFactory(root: string): (path: string) => number {
  const fileToIdMap = new Map<string, string>();
  // This is an absolute file path.
  return (modulePath: string): number => {
    // TODO: We may want a hashed version for production builds in the future.
    let id = fileToIdMap.get(modulePath);
    if (id == null) {
      // NOTE: Metro allows this but it can lead to confusing errors when dynamic requires cannot be resolved, e.g. `module 456 cannot be found`.
      if (modulePath == null) {
        id = 'MODULE_NOT_FOUND';
      } else if (isVirtualModule(modulePath)) {
        // Virtual modules should be stable.
        id = modulePath;
      } else if (path.isAbsolute(modulePath)) {
        id = path.relative(root, modulePath);
      } else {
        id = modulePath;
      }
      fileToIdMap.set(modulePath, id);
    }
    // @ts-expect-error: we patch this to support being a string.
    return id;
  };
}

export function getDefaultConfig(
  projectRoot: string,
  { mode, isCSSEnabled = true, unstable_beforeAssetSerializationPlugins }: DefaultConfigOptions = {}
): InputConfigT {
  const { getDefaultConfig: getDefaultMetroConfig, mergeConfig } = importMetroConfig(projectRoot);

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

  const reactNativePath = path.dirname(resolveFrom(projectRoot, 'react-native/package.json'));
  const sourceExtsConfig = { isTS: true, isReact: true, isModern: true };
  const sourceExts = getBareExtensions([], sourceExtsConfig);

  // Add support for cjs (without platform extensions).
  sourceExts.push('cjs');

  const reanimatedVersion = getPkgVersion(projectRoot, 'react-native-reanimated');

  let sassVersion: string | null = null;
  if (isCSSEnabled) {
    sassVersion = getPkgVersion(projectRoot, 'sass');
    // Enable SCSS by default so we can provide a better error message
    // when sass isn't installed.
    sourceExts.push('scss', 'sass', 'css');
  }

  const envFiles = runtimeEnv.getFiles(process.env.NODE_ENV, { silent: true });

  const pkg = getPackageJson(projectRoot);
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
    console.log(`- Env Files: ${envFiles}`);
    console.log(`- Sass: ${sassVersion}`);
    console.log(`- Reanimated: ${reanimatedVersion}`);
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
      unstable_conditionNames: ['require', 'import'],
      resolverMainFields: ['react-native', 'browser', 'main'],
      platforms: ['ios', 'android'],
      assetExts: metroDefaultValues.resolver.assetExts
        .concat(
          // Add default support for `expo-image` file types.
          ['heic', 'avif'],
          // Add default support for `expo-sqlite` file types.
          ['db']
        )
        .filter((assetExt) => !sourceExts.includes(assetExt)),
      sourceExts,
      nodeModulesPaths,
    },
    cacheStores: [cacheStore],
    watcher: {
      // strip starting dot from env files
      additionalExts: envFiles.map((file: string) => file.replace(/^\./, '')),
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

        const stdRuntime = resolveFrom.silent(projectRoot, 'expo/src/winter');
        if (stdRuntime) {
          preModules.push(stdRuntime);
        }

        // We need to shift this to be the first module so web Fast Refresh works as expected.
        // This will only be applied if the module is installed and imported somewhere in the bundle already.
        const metroRuntime = resolveFrom.silent(projectRoot, '@expo/metro-runtime');
        if (metroRuntime) {
          preModules.push(metroRuntime);
        }

        return preModules;
      },
      getPolyfills: ({ platform }) => {
        // Do nothing for nullish platforms.
        if (!platform) {
          return [];
        }

        if (platform === 'web') {
          return [
            // Ensure that the error-guard polyfill is included in the web polyfills to
            // make metro-runtime work correctly.
            require.resolve('@react-native/js-polyfills/error-guard'),
          ];
        }

        // Native behavior.
        return require('@react-native/js-polyfills')();
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
      // @ts-expect-error: not on type.
      unstable_renameRequire: false,
      postcssHash: getPostcssConfigHash(projectRoot),
      browserslistHash: pkg.browserslist
        ? stableHash(JSON.stringify(pkg.browserslist)).toString('hex')
        : null,
      sassVersion,
      // Ensure invalidation when the version changes due to the Babel plugin.
      reanimatedVersion,
      // Ensure invalidation when using identical projects in monorepos
      _expoRelativeProjectRoot: path.relative(serverRoot, projectRoot),
      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: require.resolve('./babel-transformer'),
      // See: https://github.com/facebook/react-native/blob/v0.73.0/packages/metro-config/index.js#L72-L74
      // TODO: The absolute path breaks invalidates caching across devices.
      asyncRequireModulePath: resolveFrom(
        reactNativePath,
        metroDefaultValues.transformer.asyncRequireModulePath
      ),
      assetRegistryPath: '@react-native/assets-registry/registry',
      assetPlugins: getAssetPlugins(projectRoot),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: false,
        },
      }),
    },
  });

  return withExpoSerializers(metroConfig, { unstable_beforeAssetSerializationPlugins });
}

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
