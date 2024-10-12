import assert from 'assert';

import { withStaticPlugin } from './withStaticPlugin';
import { ConfigPlugin, StaticPlugin } from '../Plugin.types';

/**
 * Resolves a list of plugins.
 *
 * @param config exported config
 * @param plugins list of config plugins to apply to the exported config
 */
export const withPlugins: ConfigPlugin<(StaticPlugin | ConfigPlugin | string)[]> = (
  config,
  plugins
) => {
  assert(
    Array.isArray(plugins),
    'withPlugins expected a valid array of plugins or plugin module paths'
  );
  return plugins.reduce((prev, plugin) => withStaticPlugin(prev, { plugin }), config);
};
