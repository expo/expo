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
        // No-op if the values are not defined
        if (typeof supportsPictureInPicture === 'undefined') {
            return config;
        }
        if (supportsPictureInPicture) {
            activity.$['android:supportsPictureInPicture'] = 'true';
        }
        else {
            delete activity.$['android:supportsPictureInPicture'];
        }
        return config;
    });
    return config;
};
exports.default = withExpoVideo;
