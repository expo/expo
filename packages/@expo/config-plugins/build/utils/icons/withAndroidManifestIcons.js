"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setRoundIconManifest = setRoundIconManifest;
exports.withAndroidManifestIcons = void 0;
function _index() {
  const data = require("../../index");
  _index = function () {
    return data;
  };
  return data;
}
const withAndroidManifestIcons = config => (0, _index().withAndroidManifest)(config, config => {
  config.modResults = setRoundIconManifest(config, config.modResults);
  return config;
});
exports.withAndroidManifestIcons = withAndroidManifestIcons;
function setRoundIconManifest(config, manifest) {
  var _config$android;
  const isAdaptive = !!((_config$android = config.android) !== null && _config$android !== void 0 && _config$android.adaptiveIcon);
  const application = _index().AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  if (isAdaptive) {
    application.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
  } else {
    delete application.$['android:roundIcon'];
  }
  return manifest;
}
//# sourceMappingURL=withAndroidManifestIcons.js.map