"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNavigationBarStyle = getNavigationBarStyle;
exports.setNavigationBarStyles = setNavigationBarStyles;
exports.withNavigationBar = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withNavigationBar = config => {
  const {
    androidNavigationBar = {}
  } = config;
  if ('visible' in androidNavigationBar) {
    // Immersive mode needs to be set programmatically
    _configPlugins().WarningAggregator.addWarningAndroid('androidNavigationBar.visible', 'Property is deprecated in Android 11 (API 30) and will be removed from Expo SDK.', 'https://expo.fyi/android-navigation-bar-visible-deprecated');
  }
  config = withNavigationBarStyles(config);
  return config;
};
exports.withNavigationBar = withNavigationBar;
const withNavigationBarStyles = config => {
  return (0, _configPlugins().withAndroidStyles)(config, config => {
    config.modResults = setNavigationBarStyles(config, config.modResults);
    return config;
  });
};
function setNavigationBarStyles(config, styles) {
  styles = _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: getNavigationBarStyle(config) === 'dark-content',
    parent: _configPlugins().AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true'
  });
  styles = _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    parent: _configPlugins().AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:navigationBarColor',
    value: '@android:color/transparent'
  });
  return styles;
}
function getNavigationBarStyle(config) {
  return config.androidNavigationBar?.barStyle || 'light-content';
}
//# sourceMappingURL=withAndroidNavigationBar.js.map