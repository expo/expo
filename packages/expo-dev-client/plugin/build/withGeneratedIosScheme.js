"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGeneratedIosScheme = exports.withGeneratedIosScheme = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const getDefaultScheme_1 = __importDefault(require("./getDefaultScheme"));
const withGeneratedIosScheme = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setGeneratedIosScheme(config, config.modResults);
        return config;
    });
};
exports.withGeneratedIosScheme = withGeneratedIosScheme;
function setGeneratedIosScheme(config, infoPlist) {
    // Generate a cross-platform scheme used to launch the dev client.
    const scheme = (0, getDefaultScheme_1.default)(config);
    if (!config_plugins_1.IOSConfig.Scheme.hasScheme(scheme, infoPlist)) {
        infoPlist = config_plugins_1.IOSConfig.Scheme.appendScheme(scheme, infoPlist);
    }
    return infoPlist;
}
exports.setGeneratedIosScheme = setGeneratedIosScheme;
