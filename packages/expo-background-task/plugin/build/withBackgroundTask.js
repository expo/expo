"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-background-task/package.json');
const withBackgroundTask = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        // Enable background mode processing
        if (!Array.isArray(config.modResults.UIBackgroundModes)) {
            config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes('processing')) {
            config.modResults.UIBackgroundModes.push('processing');
        }
        // With the new background task module we need to install the identifier in the Info.plist:
        // BGTaskSchedulerPermittedIdentifiers should be an array of strings - we need to
        // define our own identifier: com.expo.modules.backgroundtask.taskidentifer
        if (!Array.isArray(config.modResults.BGTaskSchedulerPermittedIdentifiers)) {
            config.modResults.BGTaskSchedulerPermittedIdentifiers = [];
        }
        if (!config.modResults.BGTaskSchedulerPermittedIdentifiers.includes('com.expo.modules.backgroundtask.processing')) {
            config.modResults.BGTaskSchedulerPermittedIdentifiers = [
                ...(config.modResults.BGTaskSchedulerPermittedIdentifiers || []),
                'com.expo.modules.backgroundtask.processing',
            ];
        }
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBackgroundTask, pkg.name, pkg.version);
