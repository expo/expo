"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAndroidSplashMainActivity = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _codeMod() {
  const data = require("@expo/config-plugins/build/android/codeMod");
  _codeMod = function () {
    return data;
  };
  return data;
}
function _generateCode() {
  const data = require("@expo/config-plugins/build/utils/generateCode");
  _generateCode = function () {
    return data;
  };
  return data;
}
const withAndroidSplashMainActivity = (config, {
  isLegacyConfig
}) => {
  if (isLegacyConfig) {
    return config;
  }
  return (0, _configPlugins().withMainActivity)(config, config => {
    const {
      modResults
    } = config;
    const {
      language
    } = modResults;
    const withImports = (0, _codeMod().addImports)(modResults.contents.replace(/(\/\/ )?setTheme\(R\.style\.AppTheme\)/, '// setTheme(R.style.AppTheme)'), ['expo.modules.splashscreen.SplashScreenManager'], language === 'java');
    const init = (0, _generateCode().mergeContents)({
      src: withImports,
      comment: '    //',
      tag: 'expo-splashscreen',
      offset: 0,
      anchor: /super\.onCreate\(null\)/,
      newSrc: '    SplashScreenManager.registerOnActivity(this)' + (language === 'java' ? ';' : '')
    });
    return {
      ...config,
      modResults: {
        ...modResults,
        contents: init.contents
      }
    };
  });
};
exports.withAndroidSplashMainActivity = withAndroidSplashMainActivity;
//# sourceMappingURL=withAndroidSplashMainActivity.js.map