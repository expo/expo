"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getReactNativeMinorVersion = void 0;
exports.setReactNativeSettingsPlugin = setReactNativeSettingsPlugin;
exports.withGradlePlugins = void 0;
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
const withGradlePlugins = config => {
  return (0, _androidPlugins().withSettingsGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setReactNativeSettingsPlugin(config.modResults.contents);
    } else {
      (0, _warnings().addWarningAndroid)('withGradlePlugins', `Cannot automatically configure app setting.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withGradlePlugins = withGradlePlugins;
const getReactNativeVersionFromPackageJson = () => {
  return require('react-native/package.json').version;
};
const getReactNativeMinorVersion = version => {
  const coreVersion = version.split('-')[0];
  return Number(coreVersion.split('.')[1]);
};
exports.getReactNativeMinorVersion = getReactNativeMinorVersion;
function setReactNativeSettingsPlugin(buildSettings) {
  const pattern = new RegExp(`plugins { }`);
  const version = getReactNativeVersionFromPackageJson();
  if (getReactNativeMinorVersion(version) >= 75) {
    return buildSettings.replace(pattern, `plugins { id("com.facebook.react.settings") }`);
  }
  return buildSettings;
}
//# sourceMappingURL=Settings.js.map