"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-audio/package.json');
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const PLAYBACK_SERVICE_NAME = 'expo.modules.audio.service.AudioControlsService';
const RECORDING_SERVICE_NAME = 'expo.modules.audio.service.AudioRecordingService';
const withAudio = (config, { microphonePermission, recordAudioAndroid = true, enableBackgroundRecording = false, enableBackgroundPlayback = true, } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSMicrophoneUsageDescription: MICROPHONE_USAGE,
    })(config, {
        NSMicrophoneUsageDescription: microphonePermission,
    });
    if (enableBackgroundRecording || enableBackgroundPlayback) {
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
        androidPermissions.push('android.permission.POST_NOTIFICATIONS');
    }
    if (enableBackgroundPlayback || enableBackgroundRecording) {
        androidPermissions.push('android.permission.FOREGROUND_SERVICE');
    }
    if (enableBackgroundPlayback) {
        androidPermissions.push('android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK');
    }
    if (enableBackgroundRecording) {
        androidPermissions.push('android.permission.FOREGROUND_SERVICE_MICROPHONE');
    }
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, androidPermissions.filter(Boolean));
    config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const application = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
        const toggleService = (serviceName, isEnabled, serviceDefinition) => {
            const existingService = application.service?.find((service) => service.$?.['android:name'] === serviceName);
            if (isEnabled) {
                if (!existingService) {
                    if (!application.service)
                        application.service = [];
                    //@ts-ignore - The ManifestService type is not exported from @expo/config-plugins
                    application.service.push(serviceDefinition);
                }
            }
            else {
                if (application.service && existingService) {
                    application.service = application.service.filter((service) => service.$?.['android:name'] !== serviceName);
                }
            }
        };
        toggleService(PLAYBACK_SERVICE_NAME, enableBackgroundPlayback, {
            $: {
                'android:name': PLAYBACK_SERVICE_NAME,
                'android:exported': 'false',
                'android:foregroundServiceType': 'mediaPlayback',
            },
            'intent-filter': [
                {
                    action: [{ $: { 'android:name': 'androidx.media3.session.MediaSessionService' } }],
                },
            ],
        });
        toggleService(RECORDING_SERVICE_NAME, enableBackgroundRecording, {
            $: {
                'android:name': RECORDING_SERVICE_NAME,
                'android:exported': 'false',
                'android:foregroundServiceType': 'microphone',
            },
        });
        return config;
    });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAudio, pkg.name, pkg.version);
