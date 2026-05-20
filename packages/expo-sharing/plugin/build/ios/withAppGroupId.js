"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAppGroupId = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withAppGroupId = (config, appGroupId) => {
    // Add do entitlements
    config = (0, config_plugins_1.withEntitlementsPlist)(config, async (config) => {
        const appGroups = config.modResults['com.apple.security.application-groups'];
        if (!appGroups) {
            config.modResults['com.apple.security.application-groups'] = [appGroupId];
            return config;
        }
        if (!appGroups.includes(appGroupId)) {
            config.modResults['com.apple.security.application-groups'] = [...appGroups, appGroupId];
        }
        return config;
    });
    // Add to Info.plist
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults['ExpoShareIntoAppGroupId'] = appGroupId;
        return config;
    });
};
exports.withAppGroupId = withAppGroupId;
