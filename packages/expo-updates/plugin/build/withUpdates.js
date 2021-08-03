"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const withUpdatesAndroid_1 = require("./withUpdatesAndroid");
const withUpdatesIOS_1 = require("./withUpdatesIOS");
const pkg = require('expo-updates/package.json');
const withUpdates = (config, props = {}) => {
    var _a;
    // The username will be passed from the CLI when the plugin is automatically used.
    const expoUsername = (_a = (props || {}).expoUsername) !== null && _a !== void 0 ? _a : config_1.getAccountUsername(config);
    config = withUpdatesAndroid_1.withUpdatesAndroid(config, { expoUsername });
    config = withUpdatesIOS_1.withUpdatesIOS(config, { expoUsername });
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withUpdates, pkg.name, pkg.version);
