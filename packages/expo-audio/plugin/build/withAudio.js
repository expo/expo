"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-audio/package.json');
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const withAudio = (config, { microphonePermission, recordAudioAndroid = true, enableBackgroundRecording = false } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSMicrophoneUsageDescription: MICROPHONE_USAGE,
    })(config, {
        NSMicrophoneUsageDescription: microphonePermission,
    });
    if (enableBackgroundRecording) {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            if (!Array.isArray(config.modResults.UIBackgroundModes)) {
                config.modResults.UIBackgroundModes = [];
            }
            if (!config.modResults.UIBackgroundModes.includes('audio')) {
                config.modResults.UIBackgroundModes.push('audio');
            }
            return config;
        });
    }
    const androidPermissions = [
        recordAudioAndroid !== false && 'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
    ];
    if (enableBackgroundRecording) {
        androidPermissions.push('android.permission.FOREGROUND_SERVICE_MICROPHONE');
        androidPermissions.push('android.permission.POST_NOTIFICATIONS');
    }
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, androidPermissions.filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAudio, pkg.name, pkg.version);
