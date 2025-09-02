"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyEnforceNavigationBarContrast = applyEnforceNavigationBarContrast;
exports.withEnforceNavigationBarContrast = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withEnforceNavigationBarContrast = (config, enforceNavigationBarContrast) => {
  return (0, _configPlugins().withAndroidStyles)(config, config => {
    return applyEnforceNavigationBarContrast(config, enforceNavigationBarContrast);
  });
};
exports.withEnforceNavigationBarContrast = withEnforceNavigationBarContrast;
function applyEnforceNavigationBarContrast(config, enforceNavigationBarContrast) {
  const enforceNavigationBarContrastItem = {
    _: enforceNavigationBarContrast ? 'true' : 'false',
    $: {
      name: 'android:enforceNavigationBarContrast',
      'tools:targetApi': '29'
    }
  };
  const {
    style = []
  } = config.modResults.resources;
  const mainThemeIndex = style.findIndex(({
    $
  }) => $.name === 'AppTheme');
  if (mainThemeIndex === -1) {
    return config;
  }
  const mainTheme = style[mainThemeIndex];
  const enforceIndex = mainTheme.item.findIndex(({
    $
  }) => $.name === 'android:enforceNavigationBarContrast');
  if (enforceIndex !== -1) {
    style[mainThemeIndex].item[enforceIndex] = enforceNavigationBarContrastItem;
    return config;
  }
  config.modResults.resources.style = [{
    $: style[mainThemeIndex].$,
    item: [enforceNavigationBarContrastItem, ...mainTheme.item]
  }, ...style.filter(({
    $
  }) => $.name !== 'AppTheme')];
  return config;
}
//# sourceMappingURL=withEnforceNavigationBarContrast.js.map