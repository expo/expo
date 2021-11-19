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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const withGeneratedAndroidScheme_1 = require("./withGeneratedAndroidScheme");
const withGeneratedIosScheme_1 = require("./withGeneratedIosScheme");
const pkg = require('expo-dev-client/package.json');
const REACT_NATIVE_CONFIG_JS = `// File created by expo-dev-client/app.plugin.js

module.exports = {
  dependencies: {
    ...require('expo-dev-client/dependencies'),
  },
};
`;
function withReactNativeConfigJs(config) {
    config = (0, config_plugins_1.withDangerousMod)(config, ['android', addReactNativeConfigAsync]);
    config = (0, config_plugins_1.withDangerousMod)(config, ['ios', addReactNativeConfigAsync]);
    return config;
}
const addReactNativeConfigAsync = async (config) => {
    const filename = path_1.default.join(config.modRequest.projectRoot, 'react-native.config.js');
    try {
        const config = fs_1.default.readFileSync(filename, 'utf8');
        if (!config.includes('expo-dev-client/dependencies')) {
            throw new Error(`Could not add expo-dev-client dependencies to existing file ${filename}. See expo-dev-client installation instructions to add them manually: ${constants_1.InstallationPage}`);
        }
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            // The file doesn't exist, so we create it.
            fs_1.default.writeFileSync(filename, REACT_NATIVE_CONFIG_JS);
        }
        else {
            throw error;
        }
    }
    return config;
};
function withDevClient(config) {
    config = (0, app_plugin_2.default)(config);
    config = (0, app_plugin_1.default)(config);
    config = withReactNativeConfigJs(config);
    config = (0, withGeneratedAndroidScheme_1.withGeneratedAndroidScheme)(config);
    config = (0, withGeneratedIosScheme_1.withGeneratedIosScheme)(config);
    return config;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withDevClient, pkg.name, pkg.version);
