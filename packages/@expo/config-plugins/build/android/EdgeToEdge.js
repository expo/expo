"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasEnabledEdgeToEdge = hasEnabledEdgeToEdge;
exports.withEdgeToEdge = exports.withConfigureEdgeToEdgeEnforcement = void 0;
function _Styles() {
  const data = require("./Styles");
  _Styles = function () {
    return data;
  };
  return data;
}
function _index() {
  const data = require("../index");
  _index = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE = 'android:windowOptOutEdgeToEdgeEnforcement';
const TAG = 'EDGE_TO_EDGE_PLUGIN';
const withEdgeToEdge = config => {
  // Check if someone has manually configured the config plugin
  const pluginIndex = edgeToEdgePluginIndex(config);
  if (config.enableEdgeToEdge === undefined && pluginIndex === null) {
    _index().WarningAggregator.addWarningAndroid(TAG, 'No configuration found for `enableEdgeToEdge` field in the project app config, falling back to false. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:', 'https://expo.fyi/edge-to-edge-rollout');
  } else if (config.enableEdgeToEdge === false && pluginIndex === null) {
    _index().WarningAggregator.addWarningAndroid(TAG, '`enableEdgeToEdge` field is explicitly set to false in the project app config. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:', 'https://expo.fyi/edge-to-edge-rollout');
  }
  const edgeToEdgeConfigPlugin = loadEdgeToEdgeConfigPlugin();
  if (edgeToEdgeConfigPlugin === null) {
    _index().WarningAggregator.addWarningAndroid(TAG, 'Failed to load the react-native-edge-to-edge config plugin, edge to edge functionality will be disabled. ' + 'To enable edge-to-edge make sure that `react-native-edge-to-edge` is installed in your project.');

    // Disable edge-to-edge enforcement if the plugin is not installed
    return withConfigureEdgeToEdgeEnforcement(config, {
      disableEdgeToEdgeEnforcement: false
    });
  }

  // Enable/disable edge-to-edge enforcement
  config = withConfigureEdgeToEdgeEnforcement(config, {
    disableEdgeToEdgeEnforcement: hasEnabledEdgeToEdge(config)
  });
  if (pluginIndex !== null) {
    const warning = constructWarning(pluginIndex, config);
    if (warning) {
      _index().WarningAggregator.addWarningAndroid('EDGE_TO_EDGE_CONFLICT', warning);
    }
    return config;
  }
  if (config.enableEdgeToEdge !== true) {
    return config;
  }

  // Run `react-native-edge-to-edge` config plugin configuration if edge-to-edge is enabled and the user hasn't added their own
  // plugin configuration in `app.json` / `app.config.json`.
  return edgeToEdgeConfigPlugin(config, {
    android: {
      parentTheme: 'Default',
      enforceNavigationBarContrast: false
    }
  });
};
exports.withEdgeToEdge = withEdgeToEdge;
const withConfigureEdgeToEdgeEnforcement = (config, {
  disableEdgeToEdgeEnforcement
}) => {
  return (0, _androidPlugins().withAndroidStyles)(config, config => {
    config.modResults = (0, _Styles().assignStylesValue)(config.modResults, {
      add: !disableEdgeToEdgeEnforcement,
      parent: (0, _Styles().getAppThemeGroup)(),
      targetApi: '35',
      name: OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE,
      value: 'true'
    });
    return config;
  });
};
exports.withConfigureEdgeToEdgeEnforcement = withConfigureEdgeToEdgeEnforcement;
function edgeToEdgePluginIndex(config) {
  const noArgumentPluginIndex = config.plugins?.findIndex(plugin => typeof plugin === 'string' && plugin.includes('react-native-edge-to-edge')) ?? -1;
  const argumentPluginIndex = config.plugins?.findIndex(plugin => typeof plugin[0] === 'string' && plugin[0].includes('react-native-edge-to-edge')) ?? -1;
  const pluginIndex = Math.max(noArgumentPluginIndex, argumentPluginIndex);
  if (pluginIndex === -1) {
    return null;
  }
  return pluginIndex;
}
function hasEnabledEdgeToEdge(config) {
  return config.enableEdgeToEdge === true || edgeToEdgePluginIndex(config) != null;
}
function constructWarning(pluginIndex, config) {
  if (pluginIndex === null) {
    return null;
  }
  if (hasEnabledEdgeToEdge(config) && config.enableEdgeToEdge === false) {
    return `You have configured the \`react-native-edge-to-edge\` plugin in your config file, while also setting the \`enableEdgeToEdge\` ` + `field to \`false\`. The value of \`enableEdgeToEdge\` field will be ignored`;
  }
  return null;
}
function loadEdgeToEdgeConfigPlugin() {
  try {
    // @ts-ignore <-- edge-to-edge plugin doesn't export a type definition
    const {
      default: plugin
    } = require('react-native-edge-to-edge/app.plugin.js');
    return plugin;
  } catch {
    return null;
  }
}
//# sourceMappingURL=EdgeToEdge.js.map