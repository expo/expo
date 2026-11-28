import type { ConfigPlugin } from '@expo/config-plugins';
import { withPlugins } from '@expo/config-plugins';

import type { GetConfigOptions } from '../Config.types';
import { ConfigError } from '../Errors';
import { serializeAfterStaticPlugins } from '../Serialize';

export const withConfigPlugins: ConfigPlugin<NonNullable<GetConfigOptions['pluginMode']>> = (
  config,
  mode
) => {
  if (!Array.isArray(config.plugins)) {
    if (mode === 'inspect' && config.plugins != null) {
      throw new ConfigError(
        'Expected the plugins field to be an array. Wrap plugin entries in an array.',
        'INVALID_CONFIG'
      );
    }
    return config;
  }
  if (!config.plugins.length) {
    return config;
  }
  if (mode === 'apply') {
    // Resolve and evaluate plugins
    // @ts-ignore: TODO: add plugins to the config schema
    config = withPlugins(config, config.plugins);
  } else if (mode === 'skip') {
    delete config.plugins;
  }
  // plugins aren't serialized by default, serialize the plugins after resolving them.
  return serializeAfterStaticPlugins(config);
};
