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
    parent: _configPlugins().AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true'
  });
  styles = _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: !!getNavigationBarColor(config),
    parent: _configPlugins().AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
    name: `android:${NAVIGATION_BAR_COLOR}`,
    value: `@color/${NAVIGATION_BAR_COLOR}`
  });
  return styles;
}

function getNavigationBarImmersiveMode(config) {
  var _config$androidNaviga;

  return ((_config$androidNaviga = config.androidNavigationBar) === null || _config$androidNaviga === void 0 ? void 0 : _config$androidNaviga.visible) || null;
}

function getNavigationBarColor(config) {
  var _config$androidNaviga2;

  return ((_config$androidNaviga2 = config.androidNavigationBar) === null || _config$androidNaviga2 === void 0 ? void 0 : _config$androidNaviga2.backgroundColor) || null;
}

function getNavigationBarStyle(config) {
  var _config$androidNaviga3;

  return ((_config$androidNaviga3 = config.androidNavigationBar) === null || _config$androidNaviga3 === void 0 ? void 0 : _config$androidNaviga3.barStyle) || 'light-content';
}
//# sourceMappingURL=withAndroidNavigationBar.js.map