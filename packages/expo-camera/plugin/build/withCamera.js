"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-camera/package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const withCamera = (config, { cameraPermission, microphonePermission, recordAudioAndroid = true } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSCameraUsageDescription: CAMERA_USAGE,
        NSMicrophoneUsageDescription: MICROPHONE_USAGE,
    })(config, {
        NSCameraUsageDescription: cameraPermission,
        NSMicrophoneUsageDescription: microphonePermission,
    });
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.CAMERA',
        // Optional
        recordAudioAndroid && 'android.permission.RECORD_AUDIO',
    ].filter(Boolean));
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCamera, pkg.name, pkg.version);
