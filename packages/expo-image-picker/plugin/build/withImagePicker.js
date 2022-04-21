"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setImagePickerInfoPlist = exports.setImagePickerManifestActivity = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-image-picker/package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';
function setImagePickerManifestActivity(androidManifest) {
    const app = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
    if (!app.activity) {
        app.activity = [];
    }
    if (!app.activity.find(({ $ }) => $['android:name'] === 'com.canhub.cropper.CropImageActivity')) {
        app.activity.push({
            $: {
                'android:name': 'com.canhub.cropper.CropImageActivity',
                'android:theme': '@style/Base.Theme.AppCompat',
            },
        });
    }
    return androidManifest;
}
exports.setImagePickerManifestActivity = setImagePickerManifestActivity;
const withImagePickerManifestActivity = (config) => {
    // This plugin has no ability to remove the activity that it adds.
    return (0, config_plugins_1.withAndroidManifest)(config, async (config) => {
        config.modResults = setImagePickerManifestActivity(config.modResults);
        return config;
    });
};
function setImagePickerInfoPlist(infoPlist, { cameraPermission, microphonePermission, photosPermission }) {
    if (photosPermission === false) {
        delete infoPlist.NSPhotoLibraryUsageDescription;
    }
    else {
        infoPlist.NSPhotoLibraryUsageDescription =
            photosPermission || infoPlist.NSPhotoLibraryUsageDescription || READ_PHOTOS_USAGE;
    }
    if (cameraPermission === false) {
        delete infoPlist.NSCameraUsageDescription;
    }
    else {
        infoPlist.NSCameraUsageDescription =
            cameraPermission || infoPlist.NSCameraUsageDescription || CAMERA_USAGE;
    }
    if (microphonePermission === false) {
        delete infoPlist.NSMicrophoneUsageDescription;
    }
    else {
        infoPlist.NSMicrophoneUsageDescription =
            microphonePermission || infoPlist.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
    }
    return infoPlist;
}
exports.setImagePickerInfoPlist = setImagePickerInfoPlist;
const withImagePicker = (config, { photosPermission, cameraPermission, microphonePermission } = {}) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setImagePickerInfoPlist(config.modResults, {
            photosPermission,
            cameraPermission,
            microphonePermission,
        });
        return config;
    });
    return (0, config_plugins_1.withPlugins)(config, [
        [
            config_plugins_1.AndroidConfig.Permissions.withPermissions,
            [
                cameraPermission !== false && 'android.permission.CAMERA',
                photosPermission !== false && 'android.permission.READ_EXTERNAL_STORAGE',
                photosPermission !== false && 'android.permission.WRITE_EXTERNAL_STORAGE',
                microphonePermission !== false && 'android.permission.RECORD_AUDIO',
            ].filter(Boolean),
        ],
        withImagePickerManifestActivity,
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withImagePicker, pkg.name, pkg.version);
