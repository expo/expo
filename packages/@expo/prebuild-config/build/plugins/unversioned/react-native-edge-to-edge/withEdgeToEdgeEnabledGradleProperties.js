"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configureEdgeToEdgeEnabledGradleProperties = configureEdgeToEdgeEnabledGradleProperties;
exports.withEdgeToEdgeEnabledGradleProperties = withEdgeToEdgeEnabledGradleProperties;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'expo.edgeToEdgeEnabled';
const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT = 'Whether the app is configured to use edge-to-edge via the app config or `react-native-edge-to-edge` plugin';
function withEdgeToEdgeEnabledGradleProperties(config, props) {
  return (0, _configPlugins().withGradleProperties)(config, config => {
    return configureEdgeToEdgeEnabledGradleProperties(config, props.edgeToEdgeEnabled);
  });
}
function configureEdgeToEdgeEnabledGradleProperties(config, edgeToEdgeEnabled) {
  const propertyIndex = config.modResults.findIndex(item => item.type === 'property' && item.key === EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY);
  if (propertyIndex !== -1) {
    config.modResults.splice(propertyIndex, 1);
  }
  const commentIndex = config.modResults.findIndex(item => item.type === 'comment' && item.value === EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT);
  if (commentIndex !== -1) {
    config.modResults.splice(commentIndex, 1);
  }
  config.modResults.push({
    type: 'comment',
    value: EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT
  });
  config.modResults.push({
    type: 'property',
    key: EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY,
    value: edgeToEdgeEnabled ? 'true' : 'false'
  });
  return config;
}
//# sourceMappingURL=withEdgeToEdgeEnabledGradleProperties.js.map