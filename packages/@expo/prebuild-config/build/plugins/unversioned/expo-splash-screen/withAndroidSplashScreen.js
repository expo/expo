"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAndroidSplashScreen = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
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
function _withAndroidSplashDrawables() {
  const data = require("./withAndroidSplashDrawables");
  _withAndroidSplashDrawables = function () {
    return data;
  };
  return data;
}
function _withAndroidSplashImages() {
  const data = require("./withAndroidSplashImages");
  _withAndroidSplashImages = function () {
    return data;
  };
  return data;
}
function _withAndroidSplashMainActivity() {
  const data = require("./withAndroidSplashMainActivity");
  _withAndroidSplashMainActivity = function () {
    return data;
  };
  return data;
}
function _withAndroidSplashStrings() {
  const data = require("./withAndroidSplashStrings");
  _withAndroidSplashStrings = function () {
    return data;
  };
  return data;
}
function _withAndroidSplashStyles() {
  const data = require("./withAndroidSplashStyles");
  _withAndroidSplashStyles = function () {
    return data;
  };
  return data;
}
const withAndroidSplashScreen = (config, props) => {
  const isLegacyConfig = props === undefined;
  const splashConfig = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config, props ?? null);

  // Update the android status bar to match the splash screen
  // androidStatusBar applies info to the app activity style.
  const backgroundColor = splashConfig?.backgroundColor || '#ffffff';
  if (config.androidStatusBar?.backgroundColor) {
    if (backgroundColor.toLowerCase() !== config.androidStatusBar?.backgroundColor?.toLowerCase?.()) {
      _configPlugins().WarningAggregator.addWarningAndroid('androidStatusBar.backgroundColor', 'Color conflicts with the splash.backgroundColor');
    }
  } else {
    if (!config.androidStatusBar) config.androidStatusBar = {};
    config.androidStatusBar.backgroundColor = backgroundColor;
  }
  return (0, _configPlugins().withPlugins)(config, [[_withAndroidSplashMainActivity().withAndroidSplashMainActivity, {
    isLegacyConfig
  }], [_withAndroidSplashImages().withAndroidSplashImages, splashConfig], [_withAndroidSplashDrawables().withAndroidSplashDrawables, splashConfig], [_withAndroidSplashStyles().withAndroidSplashStyles, {
    splashConfig,
    isLegacyConfig
  }], [_withAndroidSplashStrings().withAndroidSplashStrings, splashConfig]]);
};
exports.withAndroidSplashScreen = withAndroidSplashScreen;
//# sourceMappingURL=withAndroidSplashScreen.js.map