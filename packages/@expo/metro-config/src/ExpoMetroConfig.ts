// Copyright 2021-present 650 Industries (Expo). All rights reserved.

import { getBareExtensions } from '@expo/config/paths';
import chalk from 'chalk';
import { boolish } from 'getenv';
import { Reporter } from 'metro';
import type MetroConfig from 'metro-config';
import path from 'path';
import resolveFrom from 'resolve-from';
import { URL } from 'url';

import { getModulesPaths, getWorkspaceRoot } from './getModulesPaths';
import { getWatchFolders } from './getWatchFolders';
import { importMetroConfigFromProject } from './importMetroFromProject';

export const EXPO_DEBUG = boolish('EXPO_DEBUG', false);
const EXPO_USE_METRO_WORKSPACE_ROOT = boolish('EXPO_USE_METRO_WORKSPACE_ROOT', false);
const EXPO_USE_EXOTIC = boolish('EXPO_USE_EXOTIC', false);

// Import only the types here, the values will be imported from the project, at runtime.
export const INTERNAL_CALLSITES_REGEX = new RegExp(
  [
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Core/Timers/.+\\.js$',
    'node_modules/react-devtools-core/.+\\.js$',
    'node_modules/react-refresh/.+\\.js$',
    'node_modules/scheduler/.+\\.js$',
    // Metro replaces `require()` with a different method,
    // we want to omit this method from the stack trace.
    // This is akin to most React tooling.
    '/metro/.*/polyfills/require.js$',
    // Hide frames related to a fast refresh.
    '/metro/.*/lib/bundle-modules/.+\\.js$',
    'node_modules/react-native/Libraries/Utilities/HMRClient.js$',
    'node_modules/eventemitter3/index.js',
    'node_modules/event-target-shim/dist/.+\\.js$',
    // Ignore the log forwarder used in the expo package.
    '/expo/build/logs/RemoteConsole.js$',
    // Improve errors thrown by invariant (ex: `Invariant Violation: "main" has not been registered`).
    'node_modules/invariant/.+\\.js$',
    // Remove babel runtime additions
    'node_modules/regenerator-runtime/.+\\.js$',
    // Remove react native setImmediate ponyfill
    'node_modules/promise/setimmediate/.+\\.js$',
    // Babel helpers that implement language features
    'node_modules/@babel/runtime/.+\\.js$',
    // Hide Hermes internal bytecode
    '/InternalBytecode/InternalBytecode\\.js$',
    // Block native code invocations
    `\\[native code\\]`,
    // Hide react-dom (web)
    'node_modules/react-dom/.+\\.js$',
  ].join('|')
);

function isUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
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
  const assetPlugins: string[] = [];

  let hashAssetFilesPath;
  try {
    hashAssetFilesPath = resolveFrom(projectRoot, 'expo-asset/tools/hashAssetFiles');
  } catch {
    // TODO: we should warn/throw an error if the user has expo-updates installed but does not
    // have hashAssetFiles available, or if the user is in managed workflow and does not have
    // hashAssetFiles available. but in a bare app w/o expo-updates, just using dev-client,
    // it is not needed
  }

  if (hashAssetFilesPath) {
    assetPlugins.push(hashAssetFilesPath);
  }

  return assetPlugins;
}

let hasWarnedAboutExotic = false;

export function getDefaultConfig(
  projectRoot: string,
  options: DefaultConfigOptions = {}
): MetroConfig.InputConfigT {
  const isExotic = options.mode === 'exotic' || EXPO_USE_EXOTIC;

  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(
      chalk.gray(
        `\u203A Unstable feature ${chalk.bold`EXPO_USE_EXOTIC`} is enabled. Bundling may not work as expected, and is subject to breaking changes.`
      )
    );
  }
  const MetroConfig = importMetroConfigFromProject(projectRoot);

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
  if (EXPO_DEBUG) {
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
  } = MetroConfig.getDefaultConfig.getDefaultValues(projectRoot);

  // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
  // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
  return MetroConfig.mergeConfig(metroDefaultValues, {
    watchFolders,
    resolver: {
      resolverMainFields,
      platforms: ['ios', 'android', 'native', 'testing'],
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
      port: Number(process.env.RCT_METRO_PORT) || 8081,
      // NOTE(EvanBacon): Moves the server root down to the monorepo root.
      // This enables proper monorepo support for web.
      // @ts-expect-error: not on type
      unstable_serverRoot: EXPO_USE_METRO_WORKSPACE_ROOT
        ? getWorkspaceRoot(projectRoot) ?? projectRoot
        : projectRoot,
    },
    symbolicator: {
      customizeFrame: (frame) => {
        if (frame.file && isUrl(frame.file)) {
          return {
            ...frame,
            // HACK: This prevents Metro from attempting to read the invalid file URL it sent us.
            lineNumber: null,
            column: null,
            // This prevents the invalid frame from being shown by default.
            collapse: true,
          };
        }
        let collapse = Boolean(frame.file && INTERNAL_CALLSITES_REGEX.test(frame.file));

        if (!collapse) {
          // This represents the first frame of the stacktrace.
          // Often this looks like: `__r(0);`.
          // The URL will also be unactionable in the app and therefore not very useful to the developer.
          if (
            frame.column === 3 &&
            frame.methodName === 'global code' &&
            frame.file?.match(/^https?:\/\//g)
          ) {
            collapse = true;
          }
        }

        return { ...(frame || {}), collapse };
      },
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

export interface LoadOptions {
  config?: string;
  maxWorkers?: number;
  port?: number;
  reporter?: Reporter;
  resetCache?: boolean;
}

export async function loadAsync(
  projectRoot: string,
  { reporter, ...metroOptions }: LoadOptions = {}
): Promise<MetroConfig.ConfigT> {
  let defaultConfig = getDefaultConfig(projectRoot);
  if (reporter) {
    defaultConfig = { ...defaultConfig, reporter };
  }
  const MetroConfig = importMetroConfigFromProject(projectRoot);
  return await MetroConfig.loadConfig(
    { cwd: projectRoot, projectRoot, ...metroOptions },
    defaultConfig
  );
}
