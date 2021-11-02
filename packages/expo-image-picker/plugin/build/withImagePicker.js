"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setImagePickerManifestActivity = void 0;
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
    if (!app.activity.find(({ $ }) => $['android:name'] === 'com.theartofdev.edmodo.cropper.CropImageActivity')) {
        app.activity.push({
            $: {
                'android:name': 'com.theartofdev.edmodo.cropper.CropImageActivity',
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
const withImagePicker = (config, { photosPermission, cameraPermission, microphonePermission } = {}) => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSPhotoLibraryUsageDescription =
        photosPermission || config.ios.infoPlist.NSPhotoLibraryUsageDescription || READ_PHOTOS_USAGE;
    config.ios.infoPlist.NSCameraUsageDescription =
        cameraPermission || config.ios.infoPlist.NSCameraUsageDescription || CAMERA_USAGE;
    config.ios.infoPlist.NSMicrophoneUsageDescription =
        microphonePermission || config.ios.infoPlist.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
    return (0, config_plugins_1.withPlugins)(config, [
        [
            config_plugins_1.AndroidConfig.Permissions.withPermissions,
            [
                'android.permission.CAMERA',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
                'android.permission.RECORD_AUDIO',
            ],
        ],
        withImagePickerManifestActivity,
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withImagePicker, pkg.name, pkg.version);
