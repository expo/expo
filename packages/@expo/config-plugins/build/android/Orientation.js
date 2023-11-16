"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAndroidOrientation = exports.getOrientation = exports.withOrientation = exports.SCREEN_ORIENTATION_ATTRIBUTE = void 0;
const Manifest_1 = require("./Manifest");
const android_plugins_1 = require("../plugins/android-plugins");
exports.SCREEN_ORIENTATION_ATTRIBUTE = 'android:screenOrientation';
exports.withOrientation = (0, android_plugins_1.createAndroidManifestPlugin)(setAndroidOrientation, 'withOrientation');
function getOrientation(config) {
    return typeof config.orientation === 'string' ? config.orientation : null;
}
exports.getOrientation = getOrientation;
function setAndroidOrientation(config, androidManifest) {
    const orientation = getOrientation(config);
    // TODO: Remove this if we decide to remove any orientation configuration when not specified
    if (!orientation) {
        return androidManifest;
    }
    const mainActivity = (0, Manifest_1.getMainActivityOrThrow)(androidManifest);
    mainActivity.$[exports.SCREEN_ORIENTATION_ATTRIBUTE] =
        orientation !== 'default' ? orientation : 'unspecified';
    return androidManifest;
}
exports.setAndroidOrientation = setAndroidOrientation;
