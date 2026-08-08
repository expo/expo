import type { ExpoConfig } from '@expo/config';
import {
  normalizeStaticPlugin,
  resolveConfigPluginFunctionWithInfo,
} from '@expo/config-plugins/build/utils/plugin-resolver';
import { getAutoPlugins } from '@expo/prebuild-config';

import { attemptAddingPluginsAsync } from '../../utils/modifyConfigPlugins';
import { debugEvent } from '../events';

const AUTO_PLUGINS = getAutoPlugins();

/**
 * Resolve if a package has a config plugin.
 * For sanity, we'll only support config plugins that use the `app.config.js` entry file,
 * this is because a package like `lodash` could be a "valid" config plugin and break the prebuild process.
 *
 * @param projectRoot
 * @param packageName
 * @returns
 */
function packageHasConfigPlugin(projectRoot: string, packageName: string) {
  try {
    const info = resolveConfigPluginFunctionWithInfo(projectRoot, packageName);
    if (info.isPluginFile) {
      return info.plugin;
    }
  } catch {}
  return false;
}

/**
 * Get a list of plugins that were are supplied as string module IDs.
 * @example
 * ```json
 * {
 *   "plugins": [
 *     "expo-camera",
 *     ["react-native-firebase", ...]
 *   ]
 * }
 * ```
 *   ↓ ↓ ↓ ↓ ↓ ↓
 *
 * `['expo-camera', 'react-native-firebase']`
 *
 */
export function getNamedPlugins(plugins: NonNullable<ExpoConfig['plugins']>): string[] {
  const namedPlugins: string[] = [];
  for (const plugin of plugins) {
    try {
      // @ts-ignore
      const [normal] = normalizeStaticPlugin(plugin);
      if (typeof normal === 'string') {
        namedPlugins.push(normal);
      }
    } catch {
      // ignore assertions
    }
  }
  return namedPlugins;
}

/** Attempts to ensure that non-auto plugins are added to the `app.json` `plugins` array when modules with Expo Config Plugins are installed. */
export async function autoAddConfigPluginsAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'plugins'>,
  packages: string[]
) {
  const currentPlugins = exp.plugins || [];
  const normalized = getNamedPlugins(currentPlugins);

  debugEvent('existing_plugins', { plugins: normalized });

  const plugins = packages.filter((pkg) => {
    if (normalized.includes(pkg)) {
      // already included in plugins array
      return false;
    }
    // Check if the package has a valid plugin. Must be a well-made plugin for it to work with this.
    const plugin = packageHasConfigPlugin(projectRoot, pkg);

    debugEvent('package_has_plugin', {
      package: pkg,
      hasPlugin: !!plugin,
      argCount: plugin ? plugin.length : null,
    });

    if (AUTO_PLUGINS.includes(pkg)) {
      debugEvent('auto_plugin_skipped', { package: pkg });
      return false;
    }

    return !!plugin;
  });

  await attemptAddingPluginsAsync(projectRoot, plugins);
}
