"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserTrackingPermission = void 0;
const USER_TRACKING = 'Allow $(PRODUCT_NAME) to use data for tracking the user or the device';
exports.withUserTrackingPermission = (config, { userTrackingPermission } = {}) => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSUserTrackingUsageDescription =
        userTrackingPermission || config.ios.infoPlist.NSUserTrackingUsageDescription || USER_TRACKING;
    return config;
};
