"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-barcode-scanner/package.json');
const withBarcodeScanner = (config, { microphonePermission, cameraPermission } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
        NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone',
    })(config, {
        NSCameraUsageDescription: cameraPermission,
        NSMicrophoneUsageDescription: microphonePermission,
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, ['android.permission.CAMERA']);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBarcodeScanner, pkg.name, pkg.version);
