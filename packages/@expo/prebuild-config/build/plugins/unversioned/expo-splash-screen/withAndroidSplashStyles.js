"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSplashBackgroundColor = getSplashBackgroundColor;
exports.getSplashDarkBackgroundColor = getSplashDarkBackgroundColor;
exports.removeOldSplashStyleGroup = removeOldSplashStyleGroup;
exports.setSplashColorsForTheme = setSplashColorsForTheme;
exports.setSplashStylesForTheme = setSplashStylesForTheme;
exports.withAndroidSplashStyles = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

function _android() {
  const data = require("@expo/config-plugins/build/android");

  _android = function () {
    return data;
  };

  return data;
}

function _getAndroidSplashConfig() {
  const data = require("./getAndroidSplashConfig");

  _getAndroidSplashConfig = function () {
    return data;
  };

  return data;
}

const styleResourceGroup = {
  name: 'Theme.App.SplashScreen',
  parent: 'AppTheme'
};
const SPLASH_COLOR_NAME = 'splashscreen_background';

const withAndroidSplashStyles = config => {
  config = (0, _configPlugins().withAndroidColors)(config, config => {
    const backgroundColor = getSplashBackgroundColor(config);
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = (0, _configPlugins().withAndroidColorsNight)(config, config => {
    const backgroundColor = getSplashDarkBackgroundColor(config);
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = (0, _configPlugins().withAndroidStyles)(config, config => {
    config.modResults = removeOldSplashStyleGroup(config.modResults);
    config.modResults = setSplashStylesForTheme(config.modResults);
    return config;
  });
  return config;
}; // Remove the old style group which didn't extend the base theme properly.


exports.withAndroidSplashStyles = withAndroidSplashStyles;

function removeOldSplashStyleGroup(styles) {
  var _styles$resources$sty, _styles$resources$sty2;

  const group = {
    name: 'Theme.App.SplashScreen',
    parent: 'Theme.AppCompat.Light.NoActionBar'
  };
  styles.resources.style = (_styles$resources$sty = styles.resources.style) === null || _styles$resources$sty === void 0 ? void 0 : (_styles$resources$sty2 = _styles$resources$sty.filter) === null || _styles$resources$sty2 === void 0 ? void 0 : _styles$resources$sty2.call(_styles$resources$sty, ({
    $: head
  }) => {
    let matches = head.name === group.name;

    if (group.parent != null && matches) {
      matches = head.parent === group.parent;
    }

    return !matches;
  });
  return styles;
}

function getSplashBackgroundColor(config) {
  var _getAndroidSplashConf, _getAndroidSplashConf2;

  return (_getAndroidSplashConf = (_getAndroidSplashConf2 = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config)) === null || _getAndroidSplashConf2 === void 0 ? void 0 : _getAndroidSplashConf2.backgroundColor) !== null && _getAndroidSplashConf !== void 0 ? _getAndroidSplashConf : null;
}

function getSplashDarkBackgroundColor(config) {
  var _getAndroidDarkSplash, _getAndroidDarkSplash2;

  return (_getAndroidDarkSplash = (_getAndroidDarkSplash2 = (0, _getAndroidSplashConfig().getAndroidDarkSplashConfig)(config)) === null || _getAndroidDarkSplash2 === void 0 ? void 0 : _getAndroidDarkSplash2.backgroundColor) !== null && _getAndroidDarkSplash !== void 0 ? _getAndroidDarkSplash : null;
}

function setSplashStylesForTheme(styles) {
  // Add splash screen image
  return _configPlugins().AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    value: '@drawable/splashscreen',
    name: 'android:windowBackground',
    parent: styleResourceGroup
  });
}

function setSplashColorsForTheme(colors, backgroundColor) {
  return _android().Colors.assignColorValue(colors, {
    value: backgroundColor,
    name: SPLASH_COLOR_NAME
  });
}
//# sourceMappingURL=withAndroidSplashStyles.js.map