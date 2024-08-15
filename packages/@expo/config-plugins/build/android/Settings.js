"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
      (0, _warnings().addWarningAndroid)('withReactNativeMinorVersion', `Cannot automatically configure app setting.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withGradlePlugins = withGradlePlugins;
function setReactNativeSettingsPlugin(buildSettings) {
  const pattern = new RegExp(`plugins { }`);
  return buildSettings.replace(pattern, `
        plugins { 
            id("com.facebook.react.settings") 
        }
    `);
}
//# sourceMappingURL=Settings.js.map