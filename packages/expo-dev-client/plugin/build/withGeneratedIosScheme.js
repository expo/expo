"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGeneratedIosScheme = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const ios_plugins_1 = require("@expo/config-plugins/build/plugins/ios-plugins");
const getDefaultScheme_1 = __importDefault(require("./getDefaultScheme"));
exports.default = ios_plugins_1.createInfoPlistPlugin(setGeneratedIosScheme, 'withGeneratedIosScheme');
function setGeneratedIosScheme(config, infoPlist) {
    // Generate a cross-platform scheme used to launch the dev client.
    const scheme = getDefaultScheme_1.default(config);
    const result = config_plugins_1.IOSConfig.Scheme.appendScheme(scheme, infoPlist);
    return result;
}
exports.setGeneratedIosScheme = setGeneratedIosScheme;
