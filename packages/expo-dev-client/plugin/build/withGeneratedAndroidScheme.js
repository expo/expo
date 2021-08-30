"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGeneratedAndroidScheme = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const android_plugins_1 = require("@expo/config-plugins/build/plugins/android-plugins");
const getDefaultScheme_1 = __importDefault(require("./getDefaultScheme"));
exports.default = android_plugins_1.createAndroidManifestPlugin(setGeneratedAndroidScheme, 'withGeneratedAndroidScheme');
function setGeneratedAndroidScheme(config, androidManifest) {
    // Generate a cross-platform scheme used to launch the dev client.
    const scheme = getDefaultScheme_1.default(config);
    return config_plugins_1.AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
}
exports.setGeneratedAndroidScheme = setGeneratedAndroidScheme;
