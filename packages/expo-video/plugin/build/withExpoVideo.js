"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withExpoVideo = (config, { supportsBackgroundPlayback, supportsPictureInPicture } = {}) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
        const shouldEnableBackgroundAudio = supportsBackgroundPlayback || supportsPictureInPicture;
        // No-op if the values are not defined
        if (typeof supportsBackgroundPlayback === 'undefined' &&
            typeof supportsPictureInPicture === 'undefined') {
            return config;
        }
        if (shouldEnableBackgroundAudio && !currentBackgroundModes.includes('audio')) {
            config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
        }
        else if (!shouldEnableBackgroundAudio) {
            config.modResults.UIBackgroundModes = currentBackgroundModes.filter((mode) => mode !== 'audio');
        }
        return config;
    });
    (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const activity = config_plugins_1.AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
        // Handle Picture in Picture configuration
        if (typeof supportsPictureInPicture !== 'undefined') {
            if (supportsPictureInPicture) {
                activity.$['android:supportsPictureInPicture'] = 'true';
            }
            else {
                delete activity.$['android:supportsPictureInPicture'];
            }
        }
        // Handle background playback configuration
        if (supportsBackgroundPlayback) {
            // Add required permissions for foreground service
            config_plugins_1.AndroidConfig.Permissions.ensurePermissions(config.modResults, [
                'android.permission.FOREGROUND_SERVICE',
                'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
            ]);
            // Add the foreground service to the manifest
            const application = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
            // Check if the service already exists
            const existingService = application.service?.find((service) => service.$?.['android:name'] ===
                'expo.modules.video.playbackService.ExpoVideoPlaybackService');
            if (!existingService) {
                // Add the service if it doesn't exist
                if (!application.service) {
                    application.service = [];
                }
                application.service.push({
                    $: {
                        'android:name': 'expo.modules.video.playbackService.ExpoVideoPlaybackService',
                        'android:exported': 'false',
                        'android:foregroundServiceType': 'mediaPlayback',
                    },
                    'intent-filter': [
                        {
                            action: [
                                {
                                    $: {
                                        'android:name': 'androidx.media3.session.MediaSessionService',
                                    },
                                },
                            ],
                        },
                    ],
                });
            }
        }
        return config;
    });
    return config;
};
exports.default = withExpoVideo;
