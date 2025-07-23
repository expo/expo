import {
  ConfigPlugin,
  ExportedConfigWithProps,
  WarningAggregator,
  AndroidConfig,
} from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';

import { edgeToEdgePluginIndex, hasEnabledEdgeToEdge, loadEdgeToEdgeConfigPlugin } from './helpers';
import { withConfigureEdgeToEdgeEnforcement } from './withConfigureEdgeToEdgeEnforcement';
import { withEdgeToEdgeEnabledGradleProperties } from './withEdgeToEdgeEnabledGradleProperties';
import { withRestoreDefaultTheme } from './withRestoreDefaultTheme';

const TAG = 'EDGE_TO_EDGE_PLUGIN';

export type EdgeToEdgePlugin = ConfigPlugin<{
  android: {
    parentTheme?: string;
    enforceNavigationBarContrast?: boolean;
  };
}>;

export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
export type GradlePropertiesConfig = ExportedConfigWithProps<
  AndroidConfig.Properties.PropertiesItem[]
>;

export const withEdgeToEdge: ConfigPlugin<{ projectRoot: string }> = (config, { projectRoot }) => {
  return applyEdgeToEdge(config, projectRoot);
};

export function applyEdgeToEdge(config: ExpoConfig, projectRoot: string): ExpoConfig {
  // Check if someone has manually configured the config plugin
  const pluginIndex = edgeToEdgePluginIndex(config);
  if (config.android?.edgeToEdgeEnabled === undefined && pluginIndex === null) {
    WarningAggregator.addWarningAndroid(
      TAG,
      'No configuration found for `edgeToEdgeEnabled` field in the project app config, falling back to false. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:',
      'https://expo.fyi/edge-to-edge-rollout'
    );
  } else if (config.android?.edgeToEdgeEnabled === false && pluginIndex === null) {
    WarningAggregator.addWarningAndroid(
      TAG,
      '`edgeToEdgeEnabled` field is explicitly set to false in the project app config. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:',
      'https://expo.fyi/edge-to-edge-rollout'
    );
  }

  const edgeToEdgeConfigPlugin = loadEdgeToEdgeConfigPlugin(projectRoot);

  if (edgeToEdgeConfigPlugin === null) {
    WarningAggregator.addWarningAndroid(
      TAG,
      'Failed to load the react-native-edge-to-edge config plugin, edge to edge functionality will be disabled. ' +
        'To enable edge-to-edge make sure that `react-native-edge-to-edge` is installed in your project.'
    );

    // Disable edge-to-edge enforcement if the plugin is not installed
    config = withConfigureEdgeToEdgeEnforcement(config, {
      disableEdgeToEdgeEnforcement: true,
    });

    config = withEdgeToEdgeEnabledGradleProperties(config, { edgeToEdgeEnabled: false });
    return withRestoreDefaultTheme(config);
  }
  const edgeToEdgeEnabled = hasEnabledEdgeToEdge(config);

  config = withEdgeToEdgeEnabledGradleProperties(config, { edgeToEdgeEnabled });

  // Enable/disable edge-to-edge enforcement
  config = withConfigureEdgeToEdgeEnforcement(config, {
    disableEdgeToEdgeEnforcement: !edgeToEdgeEnabled,
  });

  if (pluginIndex !== null) {
    const warning = constructWarning(pluginIndex, config);
    if (warning) {
      WarningAggregator.addWarningAndroid('EDGE_TO_EDGE_CONFLICT', warning);
    }
    return config;
  }

  if (config.android?.edgeToEdgeEnabled !== true) {
    return withRestoreDefaultTheme(config);
  }

  // Run `react-native-edge-to-edge` config plugin configuration if edge-to-edge is enabled and the user hasn't added their own
  // plugin configuration in `app.json` / `app.config.json`.
  return edgeToEdgeConfigPlugin(config, {
    android: {
      parentTheme: 'Default',
      enforceNavigationBarContrast: true,
    },
  });
}

function constructWarning(pluginIndex: number | null, config: ExpoConfig): string | null {
  if (pluginIndex === null) {
    return null;
  }

  if (hasEnabledEdgeToEdge(config) && config?.android?.edgeToEdgeEnabled === false) {
    return (
      `You have configured the \`react-native-edge-to-edge\` plugin in your config file, while also setting the \`android.edgeToEdgeEnabled\` ` +
      `field to \`false\`. The value of \`android.edgeToEdgeEnabled\` field will be ignored`
    );
  }
  return null;
}

export default withEdgeToEdge;
