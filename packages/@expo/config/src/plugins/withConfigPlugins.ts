import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import { serializeAfterStaticPlugins } from '../Serialize';

/**
 * Resolves static plugins array as config plugin functions.
 *
 * @param config
 * @param projectRoot
 */
export const withConfigPlugins: ConfigPlugin<boolean> = (config, skipPlugins) => {
  // @ts-ignore: plugins not on config type yet -- TODO
  if (!Array.isArray(config.plugins) || !config.plugins?.length) {
    return config;
  }
  if (!skipPlugins) {
    // Resolve and evaluate plugins
    // @ts-ignore: TODO: add plugins to the config schema
    config = withPlugins(config, config.plugins);
  } else {
    // Delete the plugins array in case someone added functions or other values which cannot be automatically serialized.
    delete config.plugins;
  }
  // plugins aren't serialized by default, serialize the plugins after resolving them.
  return serializeAfterStaticPlugins(config);
};
