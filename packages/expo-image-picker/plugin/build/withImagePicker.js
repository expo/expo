"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setImagePickerInfoPlist = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-image-picker/package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';
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
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [microphonePermission !== false && 'android.permission.RECORD_AUDIO'].filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withImagePicker, pkg.name, pkg.version);
