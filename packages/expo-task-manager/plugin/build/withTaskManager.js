"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-task-manager/package.json');
const withTaskManager = (config) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (!Array.isArray(config.modResults.UIBackgroundModes)) {
            config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes('fetch')) {
            config.modResults.UIBackgroundModes.push('fetch');
        }
        return config;
    });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withTaskManager, pkg.name, pkg.version);
