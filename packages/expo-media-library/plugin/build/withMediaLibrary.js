"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyAndroidManifest = modifyAndroidManifest;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-media-library/package.json');
const GRANULAR_PERMISSIONS_MAP = {
    photo: 'android.permission.READ_MEDIA_IMAGES',
    video: 'android.permission.READ_MEDIA_VIDEO',
    audio: 'android.permission.READ_MEDIA_AUDIO',
};
const defaultGranularPermissions = ['photo', 'video', 'audio'];
function modifyAndroidManifest(manifest) {
    // Starting with Android 10, the concept of scoped storage is introduced.
    // Currently, to make expo-media-library working with that change, you have to add
    // android:requestLegacyExternalStorage="true" to AndroidManifest.xml:
    const app = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.$['android:requestLegacyExternalStorage'] = 'true';
    return manifest;
}
const withMediaLibraryExternalStorage = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, async (config) => {
        config.modResults = modifyAndroidManifest(config.modResults);
        return config;
    });
};
const withMediaLibrary = (config, { photosPermission, savePhotosPermission, isAccessMediaLocationEnabled, preventAutomaticLimitedAccessAlert, granularPermissions = defaultGranularPermissions, } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
        NSPhotoLibraryAddUsageDescription: 'Allow $(PRODUCT_NAME) to save photos',
    })(config, {
        NSPhotoLibraryUsageDescription: photosPermission,
        NSPhotoLibraryAddUsageDescription: savePhotosPermission,
    });
    config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        isAccessMediaLocationEnabled && 'android.permission.ACCESS_MEDIA_LOCATION',
        ...granularPermissions.map((type) => GRANULAR_PERMISSIONS_MAP[type]),
    ].filter(Boolean));
    if (preventAutomaticLimitedAccessAlert) {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            config.modResults.PHPhotoLibraryPreventAutomaticLimitedAccessAlert = true;
            return config;
        });
    }
    return withMediaLibraryExternalStorage(config);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withMediaLibrary, pkg.name, pkg.version);
