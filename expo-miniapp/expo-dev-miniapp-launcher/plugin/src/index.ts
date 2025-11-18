import { ConfigPlugin, createRunOncePlugin, withPlugins } from '@expo/config-plugins';

export type MiniAppLauncherPluginProps = {
  /**
   * Enable development client
   */
  enabled?: boolean;
  /**
   * Custom launcher mode
   * - 'launcher': Always show the launcher UI
   * - 'most-recent': Try to load the most recent app
   */
  launchMode?: 'launcher' | 'most-recent';
};

const withMiniAppLauncher: ConfigPlugin<MiniAppLauncherPluginProps | void> = (
  config,
  props = {}
) => {
  const { enabled = true, launchMode = 'launcher' } = props;

  if (!enabled) {
    return config;
  }

  // Add to plugins if not already present
  if (!config.plugins) {
    config.plugins = [];
  }

  // Store the configuration for use at runtime
  if (!config.extra) {
    config.extra = {};
  }

  config.extra.miniAppLauncher = {
    launchMode,
    enabled,
  };

  return config;
};

export default createRunOncePlugin(
  withMiniAppLauncher,
  'expo-dev-miniapp-launcher',
  '0.1.0'
);
