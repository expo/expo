// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { getPackageJson } from '@expo/config';
import { getBareExtensions } from '@expo/config/paths';
import * as runtimeEnv from '@expo/env';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import { Reporter } from 'metro';
import { stableHash } from 'metro-cache';
import { ConfigT as MetroConfig, InputConfigT } from 'metro-config';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getDefaultCustomizeFrame, INTERNAL_CALLSITES_REGEX } from './customizeFrame';
import { env } from './env';
import { getModulesPaths, getServerRoot } from './getModulesPaths';
import { getWatchFolders } from './getWatchFolders';
import { getRewriteRequestUrl } from './rewriteRequestUrl';
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

export function getDefaultConfig(
  projectRoot: string,
  options: DefaultConfigOptions = {}
): InputConfigT {
  const { getDefaultConfig: getDefaultMetroConfig, mergeConfig } = importMetroConfig(projectRoot);

  const isExotic = options.mode === 'exotic' || env.EXPO_USE_EXOTIC;

  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(
      chalk.gray(
        `\u203A Unstable feature ${chalk.bold`EXPO_USE_EXOTIC`} is enabled. Bundling may not work as expected, and is subject to breaking changes.`
      )
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

  let sassVersion: string | null = null;
  if (options.isCSSEnabled) {
    sassVersion = getSassVersion(projectRoot);
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
    console.log(`- Exotic: ${isExotic}`);
    console.log(`- Env Files: ${envFiles}`);
    console.log(`- Sass: ${sassVersion}`);
    console.log();
  }
  const {
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter,
    ...metroDefaultValues
  } = getDefaultMetroConfig.getDefaultValues(projectRoot);

  // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
  // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
  const metroConfig: Partial<MetroConfig> = mergeConfig(metroDefaultValues, {
    watchFolders,
    resolver: {
      // unstable_conditionsByPlatform: { web: ['browser'] },
      unstable_conditionNames: ['require', 'import', 'react-native'],
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

        // We need to shift this to be the first module so web Fast Refresh works as expected.
        // This will only be applied if the module is installed and imported somewhere in the bundle already.
        const metroRuntime = resolveFrom.silent(projectRoot, '@expo/metro-runtime');
        if (metroRuntime) {
          preModules.push(metroRuntime);
        }

        return preModules;
      },
      getPolyfills: () => require(path.join(reactNativePath, 'rn-get-polyfills'))(),
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
    transformerPath: options.isCSSEnabled
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

      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: isExotic
        ? // TODO: Combine these into one transformer.
          require.resolve('./transformer/metro-expo-exotic-babel-transformer')
        : require.resolve('./babel-transformer'),
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
      assetPlugins: getAssetPlugins(projectRoot),
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

function getSassVersion(projectRoot: string): string | null {
  const sassPkg = resolveFrom.silent(projectRoot, 'sass');
  if (!sassPkg) return null;
  const sassPkgJson = findUpPackageJson(sassPkg);
  if (!sassPkgJson) return null;
  const pkg = JsonFile.read(sassPkgJson);

  debug('sass package.json:', sassPkgJson);
  const sassVersion = pkg.version;
  if (typeof sassVersion === 'string') {
    return sassVersion;
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
