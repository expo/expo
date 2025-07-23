"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyEdgeToEdge = applyEdgeToEdge;
exports.withEdgeToEdge = exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _helpers() {
  const data = require("./helpers");
  _helpers = function () {
    return data;
  };
  return data;
}
function _withConfigureEdgeToEdgeEnforcement() {
  const data = require("./withConfigureEdgeToEdgeEnforcement");
  _withConfigureEdgeToEdgeEnforcement = function () {
    return data;
  };
  return data;
}
function _withEdgeToEdgeEnabledGradleProperties() {
  const data = require("./withEdgeToEdgeEnabledGradleProperties");
  _withEdgeToEdgeEnabledGradleProperties = function () {
    return data;
  };
  return data;
}
function _withRestoreDefaultTheme() {
  const data = require("./withRestoreDefaultTheme");
  _withRestoreDefaultTheme = function () {
    return data;
  };
  return data;
}
const TAG = 'EDGE_TO_EDGE_PLUGIN';
const withEdgeToEdge = (config, {
  projectRoot
}) => {
  return applyEdgeToEdge(config, projectRoot);
};
exports.withEdgeToEdge = withEdgeToEdge;
function applyEdgeToEdge(config, projectRoot) {
  // Check if someone has manually configured the config plugin
  const pluginIndex = (0, _helpers().edgeToEdgePluginIndex)(config);
  if (config.android?.edgeToEdgeEnabled === undefined && pluginIndex === null) {
    _configPlugins().WarningAggregator.addWarningAndroid(TAG, 'No configuration found for `edgeToEdgeEnabled` field in the project app config, falling back to false. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:', 'https://expo.fyi/edge-to-edge-rollout');
  } else if (config.android?.edgeToEdgeEnabled === false && pluginIndex === null) {
    _configPlugins().WarningAggregator.addWarningAndroid(TAG, '`edgeToEdgeEnabled` field is explicitly set to false in the project app config. In Android 16+ (targetSdkVersion 36) it will no longer be possible to disable edge-to-edge. Learn more:', 'https://expo.fyi/edge-to-edge-rollout');
  }
  const edgeToEdgeConfigPlugin = (0, _helpers().loadEdgeToEdgeConfigPlugin)(projectRoot);
  if (edgeToEdgeConfigPlugin === null) {
    _configPlugins().WarningAggregator.addWarningAndroid(TAG, 'Failed to load the react-native-edge-to-edge config plugin, edge to edge functionality will be disabled. ' + 'To enable edge-to-edge make sure that `react-native-edge-to-edge` is installed in your project.');

    // Disable edge-to-edge enforcement if the plugin is not installed
    config = (0, _withConfigureEdgeToEdgeEnforcement().withConfigureEdgeToEdgeEnforcement)(config, {
      disableEdgeToEdgeEnforcement: true
    });
    config = (0, _withEdgeToEdgeEnabledGradleProperties().withEdgeToEdgeEnabledGradleProperties)(config, {
      edgeToEdgeEnabled: false
    });
    return (0, _withRestoreDefaultTheme().withRestoreDefaultTheme)(config);
  }
  const edgeToEdgeEnabled = (0, _helpers().hasEnabledEdgeToEdge)(config);
  config = (0, _withEdgeToEdgeEnabledGradleProperties().withEdgeToEdgeEnabledGradleProperties)(config, {
    edgeToEdgeEnabled
  });

  // Enable/disable edge-to-edge enforcement
  config = (0, _withConfigureEdgeToEdgeEnforcement().withConfigureEdgeToEdgeEnforcement)(config, {
    disableEdgeToEdgeEnforcement: !edgeToEdgeEnabled
  });
  if (pluginIndex !== null) {
    const warning = constructWarning(pluginIndex, config);
    if (warning) {
      _configPlugins().WarningAggregator.addWarningAndroid('EDGE_TO_EDGE_CONFLICT', warning);
    }
    return config;
  }
  if (config.android?.edgeToEdgeEnabled !== true) {
    return (0, _withRestoreDefaultTheme().withRestoreDefaultTheme)(config);
  }

  // Run `react-native-edge-to-edge` config plugin configuration if edge-to-edge is enabled and the user hasn't added their own
  // plugin configuration in `app.json` / `app.config.json`.
  return edgeToEdgeConfigPlugin(config, {
    android: {
      parentTheme: 'Default',
      enforceNavigationBarContrast: true
    }
  });
}
function constructWarning(pluginIndex, config) {
  if (pluginIndex === null) {
    return null;
  }
  if ((0, _helpers().hasEnabledEdgeToEdge)(config) && config?.android?.edgeToEdgeEnabled === false) {
    return `You have configured the \`react-native-edge-to-edge\` plugin in your config file, while also setting the \`android.edgeToEdgeEnabled\` ` + `field to \`false\`. The value of \`android.edgeToEdgeEnabled\` field will be ignored`;
  }
  return null;
}
var _default = exports.default = withEdgeToEdge;
//# sourceMappingURL=withEdgeToEdge.js.map