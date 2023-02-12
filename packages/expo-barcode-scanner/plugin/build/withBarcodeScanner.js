"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-barcode-scanner/package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const withBarcodeScanner = (config, { microphonePermission, cameraPermission } = {}) => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSCameraUsageDescription =
        cameraPermission || config.ios.infoPlist.NSCameraUsageDescription || CAMERA_USAGE;
    config.ios.infoPlist.NSMicrophoneUsageDescription =
        microphonePermission || config.ios.infoPlist.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, ['android.permission.CAMERA']);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBarcodeScanner, pkg.name, pkg.version);
