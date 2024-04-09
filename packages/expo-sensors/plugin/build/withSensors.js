"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-sensors/package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';
const withSensors = (config, { motionPermission } = {}) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSMotionUsageDescription =
            motionPermission || config.modResults.NSMotionUsageDescription || MOTION_USAGE;
        return config;
    });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSensors, pkg.name, pkg.version);
