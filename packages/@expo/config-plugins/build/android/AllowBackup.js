"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowBackupFromManifest = exports.setAllowBackup = exports.getAllowBackup = exports.withAllowBackup = void 0;
const Manifest_1 = require("./Manifest");
const android_plugins_1 = require("../plugins/android-plugins");
exports.withAllowBackup = (0, android_plugins_1.createAndroidManifestPlugin)(setAllowBackup, 'withAllowBackup');
function getAllowBackup(config) {
    // Defaults to true.
    // https://docs.expo.dev/versions/latest/config/app/#allowbackup
    return config.android?.allowBackup ?? true;
}
exports.getAllowBackup = getAllowBackup;
function setAllowBackup(config, androidManifest) {
    const allowBackup = getAllowBackup(config);
    const mainApplication = (0, Manifest_1.getMainApplication)(androidManifest);
    if (mainApplication?.$) {
        mainApplication.$['android:allowBackup'] = String(allowBackup);
    }
    return androidManifest;
}
exports.setAllowBackup = setAllowBackup;
function getAllowBackupFromManifest(androidManifest) {
    const mainApplication = (0, Manifest_1.getMainApplication)(androidManifest);
    if (mainApplication?.$) {
        return String(mainApplication.$['android:allowBackup']) === 'true';
    }
    return null;
}
exports.getAllowBackupFromManifest = getAllowBackupFromManifest;
