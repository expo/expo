"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllowBackup = getAllowBackup;
exports.getAllowBackupFromManifest = getAllowBackupFromManifest;
exports.setAllowBackup = setAllowBackup;
exports.withAllowBackup = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const withAllowBackup = exports.withAllowBackup = (0, _androidPlugins().createAndroidManifestPlugin)(setAllowBackup, 'withAllowBackup');
function getAllowBackup(config) {
  // Defaults to true.
  // https://docs.expo.dev/versions/latest/config/app/#allowbackup
  return config.android?.allowBackup ?? true;
}
function setAllowBackup(config, androidManifest) {
  const allowBackup = getAllowBackup(config);
  const mainApplication = (0, _Manifest().getMainApplication)(androidManifest);
  if (mainApplication?.$) {
    mainApplication.$['android:allowBackup'] = String(allowBackup);
  }
  return androidManifest;
}
function getAllowBackupFromManifest(androidManifest) {
  const mainApplication = (0, _Manifest().getMainApplication)(androidManifest);
  if (mainApplication?.$) {
    return String(mainApplication.$['android:allowBackup']) === 'true';
  }
  return null;
}
//# sourceMappingURL=AllowBackup.js.map