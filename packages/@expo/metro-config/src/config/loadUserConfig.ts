import { mergeConfig, type ConfigT } from '@expo/metro/metro-config';

import { getDefaultConfig } from '../ExpoMetroConfig';
import { type LoadMetroConfigParams, resolveMetroUserConfig } from './resolveMetroUserConfig';
import { resolveBabelrcName } from '../loadBabelConfig';

export type { LoadMetroConfigParams } from './resolveMetroUserConfig';

function asWritable<T>(input: T): { -readonly [K in keyof T]: T[K] } {
  return input;
}

/** Resolves a user Metro config from the given `params.projectRoot` */
export async function loadUserConfig(params: LoadMetroConfigParams): Promise<ConfigT> {
  const defaultConfig = getDefaultConfig(params.projectRoot);
  const resolvedConfig = await resolveMetroUserConfig(params);

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
    config.transformer.enableBabelRCLookup !== false
      ? resolveBabelrcName(params.projectRoot)
      : undefined;

  return config;
}
