"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAppInfoPlist = (config, { frequentUpdates, groupIdentifier }) => (0, config_plugins_1.withInfoPlist)(config, (config) => {
    const infoPlist = config.modResults;
    infoPlist.NSSupportsLiveActivities = true;
    infoPlist.NSSupportsLiveActivitiesFrequentUpdates = frequentUpdates ?? false;
    infoPlist.ExpoWidgetsAppGroupIdentifier = groupIdentifier;
    return config;
});
exports.default = withAppInfoPlist;
