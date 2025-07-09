"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNavigationBarColor = getNavigationBarColor;
exports.getNavigationBarImmersiveMode = getNavigationBarImmersiveMode;
exports.getNavigationBarStyle = getNavigationBarStyle;
exports.setNavigationBarColors = setNavigationBarColors;
exports.setNavigationBarStyles = setNavigationBarStyles;
exports.withNavigationBar = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const NAVIGATION_BAR_COLOR = 'navigationBarColor';
const withNavigationBar = config => {
  const immersiveMode = getNavigationBarImmersiveMode(config);
  if (immersiveMode) {
    // Immersive mode needs to be set programmatically
    _configPlugins().WarningAggregator.addWarningAndroid('androidNavigationBar.visible', 'Property is deprecated in Android 11 (API 30) and will be removed from Expo SDK.', 'https://expo.fyi/android-navigation-bar-visible-deprecated');
  }
  config = withNavigationBarColors(config);
  config = withNavigationBarStyles(config);
  return config;
};
exports.withNavigationBar = withNavigationBar;
const withNavigationBarColors = config => {
  return (0, _configPlugins().withAndroidColors)(config, config => {
    config.modResults = setNavigationBarColors(config, config.modResults);
    return config;
  });
};
const withNavigationBarStyles = config => {
  return (0, _configPlugins().withAndroidStyles)(config, config => {
    config.modResults = setNavigationBarStyles(config, config.modResults);
    return config;
  });
};
function setNavigationBarColors(config, colors) {
  const hexString = getNavigationBarColor(config);
  if (hexString) {
    colors = _configPlugins().AndroidConfig.Colors.setColorItem(_configPlugins().AndroidConfig.Resources.buildResourceItem({
      name: NAVIGATION_BAR_COLOR,
      value: hexString
    }), colors);
  }
  return colors;
}
function setNavigationBarStyles(config, styles) {
  styles = _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: getNavigationBarStyle(config) === 'dark-content',
    parent: _configPlugins().AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true'
  });
  styles = _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: !!getNavigationBarColor(config),
    parent: _configPlugins().AndroidConfig.Styles.getAppThemeGroup(),
    name: `android:${NAVIGATION_BAR_COLOR}`,
    value: `@color/${NAVIGATION_BAR_COLOR}`
  });
  return styles;
}
function getNavigationBarImmersiveMode(config) {
  return config.androidNavigationBar?.visible || null;
}
function getNavigationBarColor(config) {
  return config.androidNavigationBar?.backgroundColor || null;
}
function getNavigationBarStyle(config) {
  return config.androidNavigationBar?.barStyle || 'light-content';
}
//# sourceMappingURL=withAndroidNavigationBar.js.map