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

function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));

  _jsonFile = function () {
    return data;
  };

  return data;
}

function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));

  _resolveFrom = function () {
    return data;
  };

  return data;
}

function _semver() {
  const data = _interopRequireDefault(require("semver"));

  _semver = function () {
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

function _withAndroidSplashLegacyMainActivity() {
  const data = require("./withAndroidSplashLegacyMainActivity");

  _withAndroidSplashLegacyMainActivity = function () {
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const withAndroidSplashScreen = config => {
  var _config$androidStatus;

  const splashConfig = (0, _getAndroidSplashConfig().getAndroidSplashConfig)(config); // Update the android status bar to match the splash screen
  // androidStatusBar applies info to the app activity style.

  const backgroundColor = (splashConfig === null || splashConfig === void 0 ? void 0 : splashConfig.backgroundColor) || '#ffffff';

  if ((_config$androidStatus = config.androidStatusBar) !== null && _config$androidStatus !== void 0 && _config$androidStatus.backgroundColor) {
    var _config$androidStatus2, _config$androidStatus3, _config$androidStatus4;

    if (backgroundColor.toLowerCase() !== ((_config$androidStatus2 = config.androidStatusBar) === null || _config$androidStatus2 === void 0 ? void 0 : (_config$androidStatus3 = _config$androidStatus2.backgroundColor) === null || _config$androidStatus3 === void 0 ? void 0 : (_config$androidStatus4 = _config$androidStatus3.toLowerCase) === null || _config$androidStatus4 === void 0 ? void 0 : _config$androidStatus4.call(_config$androidStatus3))) {
      _configPlugins().WarningAggregator.addWarningAndroid('androidStatusBar.backgroundColor', 'Color conflicts with the splash.backgroundColor');
    }
  } else {
    if (!config.androidStatusBar) config.androidStatusBar = {};
    config.androidStatusBar.backgroundColor = backgroundColor;
  }

  return (0, _configPlugins().withPlugins)(config, [_withAndroidSplashImages().withAndroidSplashImages, [_withAndroidSplashDrawables().withAndroidSplashDrawables, splashConfig], ...(shouldUpdateLegacyMainActivity(config) ? [_withAndroidSplashLegacyMainActivity().withAndroidSplashLegacyMainActivity] : []), _withAndroidSplashStyles().withAndroidSplashStyles, _withAndroidSplashStrings().withAndroidSplashStrings]);
};

exports.withAndroidSplashScreen = withAndroidSplashScreen;

function shouldUpdateLegacyMainActivity(config) {
  try {
    var _config$_internal;

    const projectRoot = (_config$_internal = config._internal) === null || _config$_internal === void 0 ? void 0 : _config$_internal.projectRoot;
    const packagePath = (0, _resolveFrom().default)(projectRoot, 'expo-splash-screen/package.json');

    if (packagePath) {
      var _JsonFile$read$versio, _JsonFile$read$versio2;

      const version = (_JsonFile$read$versio = (_JsonFile$read$versio2 = _jsonFile().default.read(packagePath).version) === null || _JsonFile$read$versio2 === void 0 ? void 0 : _JsonFile$read$versio2.toString()) !== null && _JsonFile$read$versio !== void 0 ? _JsonFile$read$versio : '';
      return _semver().default.lt(version, '0.12.0');
    } // If expo-splash-screen didn't be installed or included in template, we check the sdkVersion instead.


    return !!(config.sdkVersion && _semver().default.lt(config.sdkVersion, '43.0.0'));
  } catch {}

  return false;
}
//# sourceMappingURL=withAndroidSplashScreen.js.map