"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSplashStrings = setSplashStrings;
exports.withAndroidSplashStrings = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _fadeDurationUtils() {
  const data = require("./fadeDurationUtils");
  _fadeDurationUtils = function () {
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
const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';
const STATUS_BAR_TRANSLUCENT_KEY = 'expo_splash_screen_status_bar_translucent';
const FADE_DURATION_MS_KEY = 'expo_splash_screen_fade_duration_ms';
const defaultResizeMode = 'contain';
const withAndroidSplashStrings = (config, splash) => {
  return (0, _configPlugins().withStringsXml)(config, config => {
    const splashConfig = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config);
    if (splashConfig) {
      var _ref, _splash$resizeMode, _config$androidStatus;
      const resizeMode = (_ref = (_splash$resizeMode = splash === null || splash === void 0 ? void 0 : splash.resizeMode) !== null && _splash$resizeMode !== void 0 ? _splash$resizeMode : splashConfig === null || splashConfig === void 0 ? void 0 : splashConfig.resizeMode) !== null && _ref !== void 0 ? _ref : defaultResizeMode;
      const statusBarTranslucent = !!((_config$androidStatus = config.androidStatusBar) !== null && _config$androidStatus !== void 0 && _config$androidStatus.translucent);
      let duration;
      if (splash !== null && splash !== void 0 && splash.fadeDurationMs) {
        duration = (0, _fadeDurationUtils().computeFadeDurationMs)(splash === null || splash === void 0 ? void 0 : splash.fadeDurationMs);
        if (duration !== (splash === null || splash === void 0 ? void 0 : splash.fadeDurationMs)) {
          _configPlugins().WarningAggregator.addWarningAndroid('fadeDurationMs', `The fade duration value must be between ${_fadeDurationUtils().minFadeDurationMs} and ${_fadeDurationUtils().maxFadeDurationMs}. Using ${duration}.`);
        }
      } else if (splashConfig !== null && splashConfig !== void 0 && splashConfig.fadeDurationMs) {
        duration = (0, _fadeDurationUtils().computeFadeDurationMs)(splashConfig === null || splashConfig === void 0 ? void 0 : splashConfig.fadeDurationMs);
        if (duration !== (splashConfig === null || splashConfig === void 0 ? void 0 : splashConfig.fadeDurationMs)) {
          _configPlugins().WarningAggregator.addWarningAndroid('fadeDurationMs', `The fade duration value must be between ${_fadeDurationUtils().minFadeDurationMs} and ${_fadeDurationUtils().maxFadeDurationMs}. Using ${duration}.`);
        }
      } else {
        duration = _fadeDurationUtils().defaultFadeDurationMs;
      }
      config.modResults = setSplashStrings(config.modResults, resizeMode, statusBarTranslucent, `${duration}`);
    }
    return config;
  });
};
exports.withAndroidSplashStrings = withAndroidSplashStrings;
function setSplashStrings(strings, resizeMode, statusBarTranslucent, fadeDurationMs) {
  return _configPlugins().AndroidConfig.Strings.setStringItem([_configPlugins().AndroidConfig.Resources.buildResourceItem({
    name: RESIZE_MODE_KEY,
    value: resizeMode,
    translatable: false
  }), _configPlugins().AndroidConfig.Resources.buildResourceItem({
    name: STATUS_BAR_TRANSLUCENT_KEY,
    value: String(statusBarTranslucent),
    translatable: false
  }), _configPlugins().AndroidConfig.Resources.buildResourceItem({
    name: FADE_DURATION_MS_KEY,
    value: String(fadeDurationMs),
    translatable: false
  })], strings);
}
//# sourceMappingURL=withAndroidSplashStrings.js.map