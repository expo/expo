"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-audio/package.json');
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const withAudio = (config, { microphonePermission } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSMicrophoneUsageDescription: MICROPHONE_USAGE,
    })(config, {
        NSMicrophoneUsageDescription: microphonePermission,
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        microphonePermission !== false && 'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
    ].filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAudio, pkg.name, pkg.version);
