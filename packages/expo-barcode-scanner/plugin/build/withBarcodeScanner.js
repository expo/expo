"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-barcode-scanner/package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const withBarcodeScanner = (config, { microphonePermission, cameraPermission } = {}) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSCameraUsageDescription =
            cameraPermission || config.modResults.NSCameraUsageDescription || CAMERA_USAGE;
        config.modResults.NSMicrophoneUsageDescription =
            microphonePermission || config.modResults.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
        return config;
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, ['android.permission.CAMERA']);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBarcodeScanner, pkg.name, pkg.version);
