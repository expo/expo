"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWindowSoftInputModeMode = exports.setWindowSoftInputModeMode = exports.withWindowSoftInputMode = void 0;
const Manifest_1 = require("./Manifest");
const android_plugins_1 = require("../plugins/android-plugins");
const ANDROID_WINDOW_SOFT_INPUT_MODE = 'android:windowSoftInputMode';
const MAPPING = {
    pan: 'adjustPan',
    resize: 'adjustResize',
};
const withWindowSoftInputMode = (config) => {
    return (0, android_plugins_1.withAndroidManifest)(config, async (config) => {
        config.modResults = setWindowSoftInputModeMode(config, config.modResults);
        return config;
    });
};
exports.withWindowSoftInputMode = withWindowSoftInputMode;
function setWindowSoftInputModeMode(config, androidManifest) {
    const app = (0, Manifest_1.getMainActivityOrThrow)(androidManifest);
    app.$[ANDROID_WINDOW_SOFT_INPUT_MODE] = getWindowSoftInputModeMode(config);
    return androidManifest;
}
exports.setWindowSoftInputModeMode = setWindowSoftInputModeMode;
function getWindowSoftInputModeMode(config) {
    const value = config.android?.softwareKeyboardLayoutMode;
    if (!value) {
        // Default to `adjustResize` or `resize`.
        return 'adjustResize';
    }
    return MAPPING[value] ?? value;
}
exports.getWindowSoftInputModeMode = getWindowSoftInputModeMode;
