"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-task-manager/package.json');
const withTaskManager = config => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    if (!config.ios.infoPlist.UIBackgroundModes)
        config.ios.infoPlist.UIBackgroundModes = [];
    // TODO: Maybe entitlements are needed
    config.ios.infoPlist.UIBackgroundModes = [
        ...new Set(config.ios.infoPlist.UIBackgroundModes.concat(['location', 'fetch'])),
    ];
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withTaskManager, pkg.name, pkg.version);
