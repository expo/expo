"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
// @ts-expect-error missing types
const app_plugin_1 = __importDefault(require("expo-dev-launcher/app.plugin"));
// @ts-expect-error missing types
const app_plugin_2 = __importDefault(require("expo-dev-menu/app.plugin"));
const withGeneratedAndroidScheme_1 = require("./withGeneratedAndroidScheme");
const withGeneratedIosScheme_1 = require("./withGeneratedIosScheme");
const pkg = require('expo-dev-client/package.json');
function withDevClient(config, props) {
    config = (0, app_plugin_2.default)(config);
    config = (0, app_plugin_1.default)(config, props);
    const mySchemeProps = { addGeneratedScheme: true, ...props };
    if (mySchemeProps.addGeneratedScheme) {
        config = (0, withGeneratedAndroidScheme_1.withGeneratedAndroidScheme)(config);
        config = (0, withGeneratedIosScheme_1.withGeneratedIosScheme)(config);
    }
    return config;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withDevClient, pkg.name, pkg.version);
