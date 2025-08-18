"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.restoreDefaultTheme = restoreDefaultTheme;
exports.withRestoreDefaultTheme = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withRestoreDefaultTheme = config => {
  // Default theme for SDK 53 and onwards projects
  return (0, _configPlugins().withAndroidStyles)(config, config => {
    return restoreDefaultTheme(config);
  });
};
exports.withRestoreDefaultTheme = withRestoreDefaultTheme;
function restoreDefaultTheme(config) {
  const DEFAULT_THEME = 'Theme.AppCompat.DayNight.NoActionBar';
  const {
    style = []
  } = config.modResults.resources;
  const mainThemeIndex = style.findIndex(({
    $
  }) => $.name === 'AppTheme');
  if (mainThemeIndex === -1) {
    return config;
  }
  if (style[mainThemeIndex].$?.parent.includes('EdgeToEdge')) {
    config.modResults.resources.style = [{
      $: {
        name: 'AppTheme',
        parent: DEFAULT_THEME
      },
      item: style[mainThemeIndex].item
    }, ...style.filter(({
      $
    }) => $.name !== 'AppTheme')];
  }
  return config;
}
//# sourceMappingURL=withRestoreDefaultTheme.js.map