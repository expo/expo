// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { getBareExtensions } from '@expo/config/paths';
import chalk from 'chalk';
import { Reporter } from 'metro';
import {
  ConfigT as MetroConfig,
  getDefaultConfig as getDefaultMetroConfig,
  InputConfigT,
  loadConfig,
  mergeConfig,
} from 'metro-config';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getDefaultCustomizeFrame, INTERNAL_CALLSITES_REGEX } from './customizeFrame';
import { env } from './env';
import { getModulesPaths, getWorkspaceRoot } from './getModulesPaths';
import { getWatchFolders } from './getWatchFolders';

export interface LoadOptions {
  config?: string;
  maxWorkers?: number;
  port?: number;
  reporter?: Reporter;
  resetCache?: boolean;
}

export interface DefaultConfigOptions {
  mode?: 'exotic';
}

function getProjectBabelConfigFile(projectRoot: string): string | undefined {
  return (
    resolveFrom.silent(projectRoot, './babel.config.js') ||
    resolveFrom.silent(projectRoot, './.babelrc') ||
    resolveFrom.silent(projectRoot, './.babelrc.js')
  );
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

  const sourceExtsConfig = { isTS: true, isReact: true, isModern: false };
  const sourceExts = getBareExtensions([], sourceExtsConfig);

  if (isExotic) {
    // Add support for cjs (without platform extensions).
    sourceExts.push('cjs');
  }

  const babelConfigPath = getProjectBabelConfigFile(projectRoot);
  const isCustomBabelConfigDefined = !!babelConfigPath;

  const resolverMainFields: string[] = [];

  // Disable `react-native` in exotic mode, since library authors
  // use it to ship raw application code to the project.
  if (!isExotic) {
    resolverMainFields.push('react-native');
  }
  resolverMainFields.push('browser', 'main');

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
    console.log(`- Babel config: ${babelConfigPath || 'babel-preset-expo (default)'}`);
    console.log(`- Resolver Fields: ${resolverMainFields.join(', ')}`);
    console.log(`- Watch Folders: ${watchFolders.join(', ')}`);
    console.log(`- Node Module Paths: ${nodeModulesPaths.join(', ')}`);
    console.log(`- Exotic: ${isExotic}`);
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
  return mergeConfig(metroDefaultValues, {
    watchFolders,
    resolver: {
      resolverMainFields,
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
    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve(path.join(reactNativePath, 'Libraries/Core/InitializeCore')),
        // TODO: Bacon: load Expo side-effects
      ],
      getPolyfills: () => require(path.join(reactNativePath, 'rn-get-polyfills'))(),
    },
    server: {
      port: Number(env.RCT_METRO_PORT) || 8081,
      // NOTE(EvanBacon): Moves the server root down to the monorepo root.
      // This enables proper monorepo support for web.
      // @ts-expect-error: not on type
      unstable_serverRoot: env.EXPO_USE_METRO_WORKSPACE_ROOT
        ? getWorkspaceRoot(projectRoot) ?? projectRoot
        : projectRoot,
    },
    symbolicator: {
      customizeFrame: getDefaultCustomizeFrame(),
    },
    transformer: {
      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: isExotic
        ? require.resolve('./transformer/metro-expo-exotic-babel-transformer')
        : isCustomBabelConfigDefined
        ? // If the user defined a babel config file in their project,
          // then use the default transformer.
          // Try to use the project copy before falling back on the global version
          resolveFrom.silent(projectRoot, 'metro-react-native-babel-transformer')
        : // Otherwise, use a custom transformer that uses `babel-preset-expo` by default for projects.
          require.resolve('./transformer/metro-expo-babel-transformer'),
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
      assetPlugins: getAssetPlugins(projectRoot),
    },
  });
}

export async function loadAsync(
  projectRoot: string,
  { reporter, ...metroOptions }: LoadOptions = {}
): Promise<MetroConfig> {
  let defaultConfig = getDefaultConfig(projectRoot);
  if (reporter) {
    defaultConfig = { ...defaultConfig, reporter };
  }
  return await loadConfig({ cwd: projectRoot, projectRoot, ...metroOptions }, defaultConfig);
}

// re-export for use in config files.
export { MetroConfig, INTERNAL_CALLSITES_REGEX };

// re-export for legacy cases.
export const EXPO_DEBUG = env.EXPO_DEBUG;
