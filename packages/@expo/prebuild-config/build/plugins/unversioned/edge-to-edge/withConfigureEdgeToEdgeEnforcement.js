"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configureEdgeToEdgeEnforcement = configureEdgeToEdgeEnforcement;
exports.withConfigureEdgeToEdgeEnforcement = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE = 'android:windowOptOutEdgeToEdgeEnforcement';
const withConfigureEdgeToEdgeEnforcement = (config, {
  disableEdgeToEdgeEnforcement
}) => {
  return (0, _configPlugins().withAndroidStyles)(config, config => {
    return configureEdgeToEdgeEnforcement(config, disableEdgeToEdgeEnforcement);
  });
};
exports.withConfigureEdgeToEdgeEnforcement = withConfigureEdgeToEdgeEnforcement;
function configureEdgeToEdgeEnforcement(config, disableEdgeToEdgeEnforcement) {
  const {
    style = []
  } = config.modResults.resources;
  const disableEdgeToEdgeEnforcementItem = {
    _: 'true',
    $: {
      name: OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE,
      'tools:targetApi': '35'
    }
  };
  const mainThemeIndex = style.findIndex(({
    $
  }) => $.name === 'AppTheme');
  if (mainThemeIndex === -1) {
    return config;
  }
  const existingItem = style[mainThemeIndex].item.filter(({
    $
  }) => $.name !== OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE);
  if (disableEdgeToEdgeEnforcement) {
    existingItem.push(disableEdgeToEdgeEnforcementItem);
  }
  if (!config.modResults.resources.style) {
    return config;
  }
  config.modResults.resources.style[mainThemeIndex].item = existingItem;
  return config;
}
//# sourceMappingURL=withConfigureEdgeToEdgeEnforcement.js.map