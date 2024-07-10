"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAndroidSplashManifest = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withAndroidSplashManifest = config => {
  return (0, _configPlugins().withAndroidManifest)(config, config => {
    const {
      modResults
    } = config;
    console.log(modResults.manifest.application?.[0].activity);
    return config;
  });
};
exports.withAndroidSplashManifest = withAndroidSplashManifest;
//# sourceMappingURL=withAndroidSplashManifest.js.map