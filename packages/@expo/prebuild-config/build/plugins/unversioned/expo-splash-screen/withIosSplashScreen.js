"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withIosSplashScreen = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

function _debug() {
  const data = _interopRequireDefault(require("debug"));

  _debug = function () {
    return data;
  };

  return data;
}

function _getIosSplashConfig() {
  const data = require("./getIosSplashConfig");

  _getIosSplashConfig = function () {
    return data;
  };

  return data;
}

function _withIosSplashAssets() {
  const data = require("./withIosSplashAssets");

  _withIosSplashAssets = function () {
    return data;
  };

  return data;
}

function _withIosSplashInfoPlist() {
  const data = require("./withIosSplashInfoPlist");

  _withIosSplashInfoPlist = function () {
    return data;
  };

  return data;
}

function _withIosSplashScreenStoryboard() {
  const data = require("./withIosSplashScreenStoryboard");

  _withIosSplashScreenStoryboard = function () {
    return data;
  };

  return data;
}

function _withIosSplashXcodeProject() {
  const data = require("./withIosSplashXcodeProject");

  _withIosSplashXcodeProject = function () {
    return data;
  };

  return data;
}

function _wtihIosSplashScreenStoryboardImage() {
  const data = require("./wtihIosSplashScreenStoryboardImage");

  _wtihIosSplashScreenStoryboardImage = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug().default)('expo:prebuild-config:expo-splash-screen:ios');

const withIosSplashScreen = (config, splash) => {
  // only warn once
  (0, _getIosSplashConfig().warnUnsupportedSplashProperties)(config); // If the user didn't specify a splash object, infer the splash object from the Expo config.

  if (!splash) {
    splash = (0, _getIosSplashConfig().getIosSplashConfig)(config);
  } else {
    debug(`custom splash config provided`);
  }

  debug(`config:`, splash);
  return (0, _configPlugins().withPlugins)(config, [[_withIosSplashInfoPlist().withIosSplashInfoPlist, splash], [_withIosSplashAssets().withIosSplashAssets, splash], // Add the image settings to the storyboard.
  [_wtihIosSplashScreenStoryboardImage().withIosSplashScreenImage, splash], // Link storyboard to xcode project.
  // TODO: Maybe fold this into the base mod.
  _withIosSplashXcodeProject().withIosSplashXcodeProject, // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
  _withIosSplashScreenStoryboard().withIosSplashScreenStoryboardBaseMod]);
};

exports.withIosSplashScreen = withIosSplashScreen;
//# sourceMappingURL=withIosSplashScreen.js.map