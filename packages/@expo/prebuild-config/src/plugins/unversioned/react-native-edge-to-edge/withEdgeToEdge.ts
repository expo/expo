import {
  ConfigPlugin,
  WarningAggregator,
  withAndroidStyles,
  withGradleProperties,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE = 'android:windowOptOutEdgeToEdgeEnforcement';
const TAG = 'EDGE_TO_EDGE_PLUGIN';
const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'expo.edgeToEdgeEnabled';
const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT =
  'Whether the app is configured to use edge-to-edge via the application config or `react-native-edge-to-edge` plugin';

type EdgeToEdgePlugin = ConfigPlugin<{
  android: {
    parentTheme?: string;
    enforceNavigationBarContrast?: boolean;
  };
}>;

export const withEdgeToEdge: ConfigPlugin = (config) => {
  // Check if someone has manually configured the config plugin
  const pluginIndex = edgeToEdgePluginIndex(config);

  if (config.edgeToEdgeEnabled === undefined && pluginIndex === null) {
    WarningAggregator.addWarningAndroid(
      TAG,
      'No configuration found for `edgeToEdgeEnabled` field in the project app config, falling back to false. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:',
      'https://expo.fyi/edge-to-edge-rollout'
    );
  } else if (config.edgeToEdgeEnabled === false && pluginIndex === null) {
    WarningAggregator.addWarningAndroid(
      TAG,
      '`edgeToEdgeEnabled` field is explicitly set to false in the project app config. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:',
      'https://expo.fyi/edge-to-edge-rollout'
    );
  }
  const edgeToEdgeConfigPlugin = loadEdgeToEdgeConfigPlugin();

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

  if (config.edgeToEdgeEnabled !== true) {
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
};

export const withConfigureEdgeToEdgeEnforcement: ConfigPlugin<{
  disableEdgeToEdgeEnforcement: boolean;
}> = (config, { disableEdgeToEdgeEnforcement }) => {
  return withAndroidStyles(config, (config) => {
    const { style = [] } = config.modResults.resources;

    const disableEdgeToEdgeEnforcementItem = {
      _: 'true',
      $: {
        name: OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE,
        'tools:targetApi': '35',
      },
    };

    const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');

    if (mainThemeIndex === -1) {
      return config;
    }

    const existingItem = style[mainThemeIndex].item.filter(
      ({ $ }) => $.name !== OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE
    );

    if (disableEdgeToEdgeEnforcement) {
      existingItem.push(disableEdgeToEdgeEnforcementItem);
    }
    if (!config.modResults.resources.style) {
      return config;
    }

    config.modResults.resources.style[mainThemeIndex].item = existingItem;
    return config;
  });
};

export function withEdgeToEdgeEnabledGradleProperties(
  config: ExpoConfig,
  props: {
    edgeToEdgeEnabled: boolean;
  }
) {
  return withGradleProperties(config, (config) => {
    const propertyIndex = config.modResults.findIndex(
      (item) => item.type === 'property' && item.key === EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY
    );
    if (propertyIndex !== -1) {
      config.modResults.splice(propertyIndex, 1);
    }
    const commentIndex = config.modResults.findIndex(
      (item) =>
        item.type === 'comment' && item.value === EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT
    );
    if (commentIndex !== -1) {
      config.modResults.splice(commentIndex, 1);
    }

    config.modResults.push({
      type: 'comment',
      value: EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT,
    });
    config.modResults.push({
      type: 'property',
      key: EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY,
      value: props.edgeToEdgeEnabled ? 'true' : 'false',
    });

    return config;
  });
}

export const withRestoreDefaultTheme: ConfigPlugin = (config) => {
  // Default theme for SDK 53 and onwards projects
  const DEFAULT_THEME = 'Theme.AppCompat.DayNight.NoActionBar';

  return withAndroidStyles(config, (config) => {
    const { style = [] } = config.modResults.resources;
    const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');
    if (mainThemeIndex === -1) {
      return config;
    }

    if (style[mainThemeIndex].$?.parent.includes('EdgeToEdge')) {
      config.modResults.resources.style = [
        {
          $: {
            name: 'AppTheme',
            parent: DEFAULT_THEME,
          },
          item: style[mainThemeIndex].item,
        },
        ...style.filter(({ $ }) => $.name !== 'AppTheme'),
      ];
    }
    return config;
  });
};

function edgeToEdgePluginIndex(config: ExpoConfig): number | null {
  const noArgumentPluginIndex =
    config.plugins?.findIndex(
      (plugin) => typeof plugin === 'string' && plugin.includes('react-native-edge-to-edge')
    ) ?? -1;

  const argumentPluginIndex =
    config.plugins?.findIndex(
      (plugin) => typeof plugin[0] === 'string' && plugin[0].includes('react-native-edge-to-edge')
    ) ?? -1;

  const pluginIndex = Math.max(noArgumentPluginIndex, argumentPluginIndex);

  if (pluginIndex === -1) {
    return null;
  }
  return pluginIndex;
}

export function hasEnabledEdgeToEdge(config: ExpoConfig) {
  return config.edgeToEdgeEnabled === true || edgeToEdgePluginIndex(config) != null;
}

function constructWarning(pluginIndex: number | null, config: ExpoConfig): string | null {
  if (pluginIndex === null) {
    return null;
  }

  if (hasEnabledEdgeToEdge(config) && config.edgeToEdgeEnabled === false) {
    return (
      `You have configured the \`react-native-edge-to-edge\` plugin in your config file, while also setting the \`edgeToEdgeEnabled\` ` +
      `field to \`false\`. The value of \`edgeToEdgeEnabled\` field will be ignored`
    );
  }
  return null;
}

function loadEdgeToEdgeConfigPlugin(): EdgeToEdgePlugin | null {
  try {
    // @ts-ignore <-- edge-to-edge plugin doesn't export a type definition
    const { default: plugin } = require('react-native-edge-to-edge/app.plugin.js');
    return plugin as EdgeToEdgePlugin;
  } catch {
    return null;
  }
}

export default withEdgeToEdge;
