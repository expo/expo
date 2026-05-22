import { mergeConfig, type ConfigT } from '@expo/metro/metro-config';

import { getDefaultConfig } from '../ExpoMetroConfig';
import { type LoadMetroConfigParams, loadUserConfig } from './loadUserConfig';
import { resolveBabelrcName } from '../loadBabelConfig';

export type { LoadMetroConfigParams } from './loadUserConfig';

function asWritable<T>(input: T): { -readonly [K in keyof T]: T[K] } {
  return input;
}

/** Resolves a user Metro config from the given `params.projectRoot` */
export async function loadConfig(params: LoadMetroConfigParams): Promise<ConfigT> {
  const defaultConfig = getDefaultConfig(params.projectRoot);
  const resolvedConfig = await loadUserConfig(params);

  let config: ConfigT = resolvedConfig.isEmpty
    ? defaultConfig
    : await mergeConfig(defaultConfig, resolvedConfig.config);

  config = {
    ...config,
    // Set the watchFolders to include the projectRoot, as Metro assumes this
    watchFolders: !config.watchFolders.includes(config.projectRoot)
      ? [config.projectRoot, ...config.watchFolders]
      : config.watchFolders,
  };

  // NOTE(@kitten): Pass a hint to the transformer on where to find the Babel config
  asWritable(config.transformer).extendsBabelConfigPath =
    config.transformer.enableBabelRCLookup !== false ? resolveBabelrcName(params.projectRoot) : undefined;

  // NOTE(@kitten): `useWatchman` is currently enabled by default, but it also disables `forceNodeFilesystemAPI`.
  // If we instead set it to the special value `null`, it gets enables but also bypasses the "native find" codepath,
  // which is slower than just using the Node filesystem API
  // See: https://github.com/facebook/metro/blob/b9c243f/packages/metro-file-map/src/index.js#L326
  // See: https://github.com/facebook/metro/blob/b9c243f/packages/metro/src/node-haste/DependencyGraph/createFileMap.js#L109
  if (config.resolver.useWatchman === true) {
    asWritable(config.resolver).useWatchman = null as any;
  }

  return config;
}
