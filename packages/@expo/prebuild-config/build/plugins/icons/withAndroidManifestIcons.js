"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setRoundIconManifest = setRoundIconManifest;
exports.withAndroidManifestIcons = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withAndroidManifestIcons = config => (0, _configPlugins().withAndroidManifest)(config, config => {
  config.modResults = setRoundIconManifest(config, config.modResults);
  return config;
});
exports.withAndroidManifestIcons = withAndroidManifestIcons;
function setRoundIconManifest(config, manifest) {
  const isAdaptive = !!config.android?.adaptiveIcon;
  const application = _configPlugins().AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  if (isAdaptive) {
    application.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
  } else {
    delete application.$['android:roundIcon'];
  }
  return manifest;
}
//# sourceMappingURL=withAndroidManifestIcons.js.map