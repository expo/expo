"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withLiveActivities = (config, { frequentUpdates }) => (0, config_plugins_1.withInfoPlist)(config, (config) => {
    const infoPlist = config.modResults;
    infoPlist.NSSupportsLiveActivities = true;
    infoPlist.NSSupportsLiveActivitiesFrequentUpdates = frequentUpdates ?? false;
    return config;
});
exports.default = withLiveActivities;
