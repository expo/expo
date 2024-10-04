// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { getPackageJson } from '@expo/config';
import { getBareExtensions } from '@expo/config/paths';
import * as runtimeEnv from '@expo/env';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import { Reporter } from 'metro';
import { stableHash } from 'metro-cache';
import { ConfigT as MetroConfig, InputConfigT } from 'metro-config';
import os from 'os';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getDefaultCustomizeFrame, INTERNAL_CALLSITES_REGEX } from './customizeFrame';
import { env } from './env';
import { FileStore } from './file-store';
import { getModulesPaths, getServerRoot } from './getModulesPaths';
import { getWatchFolders } from './getWatchFolders';
import { getRewriteRequestUrl } from './rewriteRequestUrl';
import { JSModule } from './serializer/getCssDeps';
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
}

function getAssetPlugins(projectRoot: string): string[] {
  const hashAssetFilesPath = resolveFrom.silent(projectRoot, 'expo-asset/tools/hashAssetFiles');

  if (!hashAssetFilesPath) {
    throw new Error(`The required package \`expo-asset\` cannot be found`);
  }

  return [hashAssetFilesPath];
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

export function getDefaultConfig(
  projectRoot: string,
  { mode, isCSSEnabled = true }: DefaultConfigOptions = {}
): InputConfigT {
  const { getDefaultConfig: getDefaultMetroConfig, mergeConfig } = importMetroConfig(projectRoot);

  if (isCSSEnabled) {
    patchMetroGraphToSupportUncachedModules();
  }

  const isExotic = mode === 'exotic' || env.EXPO_USE_EXOTIC;

  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(
      chalk.gray(`\u203A Feature ${chalk.bold`EXPO_USE_EXOTIC`} is no longer supported.`)
    );
  }

  const reactNativePath = path.dirname(resolveFrom(projectRoot, 'react-native/package.json'));

  try {
    // Set the `EXPO_METRO_CACHE_KEY_VERSION` variable for use in the custom babel transformer.
    // This hack is used because there doesn't appear to be anyway to resolve
    // `babel-preset-fbjs` relative to the project root later (in `metro-expo-babel-transformer`).
    const babelPresetFbjsPath = resolveFrom(projectRoot, 'babel-preset-fbjs/package.json');
    process.env.EXPO_METRO_CACHE_KEY_VERSION = String(require(babelPresetFbjsPath).version);
  } catch {
    // noop -- falls back to a hardcoded value.
  }

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
  // TODO: nodeModulesPaths does not work with the new Node.js package.json exports API, this causes packages like uuid to fail. Disabling for now.
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
          ['heic', 'avif']
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
      getModulesRunBeforeMainModule: () => {
        const preModules: string[] = [
          // MUST be first
          require.resolve(path.join(reactNativePath, 'Libraries/Core/InitializeCore')),
        ];

        const stdRuntime = resolveFrom.silent(projectRoot, 'expo/build/winter');
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
      getPolyfills: () => require('@react-native/js-polyfills')(),
    },
    server: {
      rewriteRequestUrl: getRewriteRequestUrl(projectRoot),
      port: Number(env.RCT_METRO_PORT) || 8081,
      // NOTE(EvanBacon): Moves the server root down to the monorepo root.
      // This enables proper monorepo support for web.
      unstable_serverRoot: getServerRoot(projectRoot),
    },
    symbolicator: {
      customizeFrame: getDefaultCustomizeFrame(),
    },
    transformerPath: isCSSEnabled
      ? // Custom worker that adds CSS support for Metro web.
        require.resolve('./transform-worker/transform-worker')
      : metroDefaultValues.transformerPath,

    transformer: {
      // Custom: These are passed to `getCacheKey` and ensure invalidation when the version changes.
      // @ts-expect-error: not on type.
      postcssHash: getPostcssConfigHash(projectRoot),
      browserslistHash: pkg.browserslist
        ? stableHash(JSON.stringify(pkg.browserslist)).toString('hex')
        : null,
      sassVersion,
      // Ensure invalidation when the version changes due to the Babel plugin.
      reanimatedVersion,

      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: require.resolve('./babel-transformer'),
      assetRegistryPath: '@react-native/assets-registry/registry',
      assetPlugins: getAssetPlugins(projectRoot),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  });

  return withExpoSerializers(metroConfig);
}

export async function loadAsync(
  projectRoot: string,
  { reporter, ...metroOptions }: LoadOptions = {}
): Promise<MetroConfig> {
  let defaultConfig = getDefaultConfig(projectRoot);
  if (reporter) {
    defaultConfig = { ...defaultConfig, reporter };
  }

  const { loadConfig } = importMetroConfig(projectRoot);

  return await loadConfig({ cwd: projectRoot, projectRoot, ...metroOptions }, defaultConfig);
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
