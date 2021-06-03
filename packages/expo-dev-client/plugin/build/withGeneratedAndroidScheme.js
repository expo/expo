"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGeneratedAndroidScheme = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const android_plugins_1 = require("@expo/config-plugins/build/plugins/android-plugins");
const generateScheme_1 = __importDefault(require("./generateScheme"));
exports.default = android_plugins_1.createAndroidManifestPlugin(setGeneratedAndroidScheme, 'withGeneratedAndroidScheme');
function setGeneratedAndroidScheme(config, androidManifest) {
    if (!config.scheme) {
        // No cross-platform scheme specified in configuration,
        // generate one to be used for launching the dev client.
        const scheme = generateScheme_1.default(config);
        return config_plugins_1.AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
    }
    return androidManifest;
}
exports.setGeneratedAndroidScheme = setGeneratedAndroidScheme;
