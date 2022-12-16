"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootViewBackgroundColor = getRootViewBackgroundColor;
exports.setRootViewBackgroundColor = setRootViewBackgroundColor;
exports.shouldUseLegacyBehavior = shouldUseLegacyBehavior;
exports.warnSystemUIMissing = warnSystemUIMissing;
exports.withIosRootViewBackgroundColor = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _normalizeColor() {
  const data = _interopRequireDefault(require("@react-native/normalize-color"));
  _normalizeColor = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// @ts-ignore: uses flow

// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';
const debug = require('debug')('expo:system-ui:plugin:ios');
const withIosRootViewBackgroundColor = config => {
  config = (0, _configPlugins().withInfoPlist)(config, config => {
    if (shouldUseLegacyBehavior(config)) {
      config.modResults = setRootViewBackgroundColor(config, config.modResults);
    } else {
      warnSystemUIMissing(config);
    }
    return config;
  });
  return config;
};

/** The template was changed in SDK 43 to move the background color logic to the `expo-system-ui` module */
exports.withIosRootViewBackgroundColor = withIosRootViewBackgroundColor;
function shouldUseLegacyBehavior(config) {
  try {
    return !!(config.sdkVersion && _semver().default.lt(config.sdkVersion, '44.0.0'));
  } catch {}
  return false;
}
function warnSystemUIMissing(config) {
  const backgroundColor = getRootViewBackgroundColor(config);
  if (backgroundColor) {
    // Background color needs to be set programmatically
    _configPlugins().WarningAggregator.addWarningIOS('ios.backgroundColor', 'Install expo-system-ui to enable this feature', 'https://docs.expo.dev/build-reference/migrating/#expo-config--backgroundcolor--depends-on');
  }
}
function setRootViewBackgroundColor(config, infoPlist) {
  const backgroundColor = getRootViewBackgroundColor(config);
  if (!backgroundColor) {
    delete infoPlist[BACKGROUND_COLOR_KEY];
  } else {
    let color = (0, _normalizeColor().default)(backgroundColor);
    if (!color) {
      throw new Error('Invalid background color on iOS');
    }
    color = (color << 24 | color >>> 8) >>> 0;
    infoPlist[BACKGROUND_COLOR_KEY] = color;
    debug(`Convert color: ${backgroundColor} -> ${color}`);
  }
  return infoPlist;
}
function getRootViewBackgroundColor(config) {
  var _config$ios;
  return ((_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.backgroundColor) || config.backgroundColor || null;
}
//# sourceMappingURL=withIosRootViewBackgroundColor.js.map