"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGeneratedAndroidScheme = exports.withGeneratedAndroidScheme = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const getDefaultScheme_1 = __importDefault(require("./getDefaultScheme"));
const withGeneratedAndroidScheme = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setGeneratedAndroidScheme(config, config.modResults);
        return config;
    });
};
exports.withGeneratedAndroidScheme = withGeneratedAndroidScheme;
function setGeneratedAndroidScheme(config, androidManifest) {
    // Generate a cross-platform scheme used to launch the dev client.
    const scheme = (0, getDefaultScheme_1.default)(config);
    if (!config_plugins_1.AndroidConfig.Scheme.hasScheme(scheme, androidManifest)) {
        androidManifest = config_plugins_1.AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
    }
    return androidManifest;
}
exports.setGeneratedAndroidScheme = setGeneratedAndroidScheme;
