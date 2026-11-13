import type { ConfigPlugin } from '@expo/config-plugins';

import type { ConfigFilePaths } from '../Config.types';

export const EXPO_DEBUG = ['true', '1'].includes((process.env.EXPO_DEBUG ?? '').toLowerCase());

/**
 * Adds the _internal object.
 *
 * @param config
 * @param projectRoot
 */
export const withInternal: ConfigPlugin<
  { projectRoot: string; packageJsonPath?: string } & Partial<ConfigFilePaths>
> = (config, internals) => {
  if (!config._internal) {
    config._internal = {};
  }

  config._internal = {
    isDebug: EXPO_DEBUG,
    ...config._internal,
    ...internals,
  };

  return config;
};
