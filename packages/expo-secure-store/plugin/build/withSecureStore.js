"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-secure-store/package.json');
const FACEID_USAGE = 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.';
const withSecureStore = (config, { faceIDPermission } = {}) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSFaceIDUsageDescription =
            faceIDPermission || config.modResults.NSFaceIDUsageDescription || FACEID_USAGE;
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSecureStore, pkg.name, pkg.version);
