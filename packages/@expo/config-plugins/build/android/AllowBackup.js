"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllowBackup = getAllowBackup;
exports.getAllowBackupFromManifest = getAllowBackupFromManifest;
exports.setAllowBackup = setAllowBackup;
exports.withAllowBackup = void 0;

function _androidPlugins() {
  const data = require("../plugins/android-plugins");

  _androidPlugins = function () {
    return data;
  };

  return data;
}

function _Manifest() {
  const data = require("./Manifest");

  _Manifest = function () {
    return data;
  };

  return data;
}

const withAllowBackup = (0, _androidPlugins().createAndroidManifestPlugin)(setAllowBackup, 'withAllowBackup');
exports.withAllowBackup = withAllowBackup;

function getAllowBackup(config) {
  var _config$android$allow, _config$android;

  // Defaults to true.
  // https://docs.expo.dev/versions/latest/config/app/#allowbackup
  return (_config$android$allow = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.allowBackup) !== null && _config$android$allow !== void 0 ? _config$android$allow : true;
}

function setAllowBackup(config, androidManifest) {
  const allowBackup = getAllowBackup(config);
  const mainApplication = (0, _Manifest().getMainApplication)(androidManifest);

  if (mainApplication !== null && mainApplication !== void 0 && mainApplication.$) {
    mainApplication.$['android:allowBackup'] = String(allowBackup);
  }

  return androidManifest;
}

function getAllowBackupFromManifest(androidManifest) {
  const mainApplication = (0, _Manifest().getMainApplication)(androidManifest);

  if (mainApplication !== null && mainApplication !== void 0 && mainApplication.$) {
    return String(mainApplication.$['android:allowBackup']) === 'true';
  }

  return null;
}
//# sourceMappingURL=AllowBackup.js.map