"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIcons = void 0;
const image_utils_1 = require("@expo/image-utils");
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = require("fs");
const path_1 = require("path");
const BASELINE_PIXEL_SIZE = 96;
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android expo-video icons.';
const ANDROID_DRAWABLE_PATH = 'android/app/src/main/res/drawable/';
const EXPO_VIDEO_ICON_PREFIX = 'expo_video_icon_';
async function writeIconAsync(icon, projectRoot) {
    const drawableFolderPath = (0, path_1.resolve)(projectRoot, ANDROID_DRAWABLE_PATH);
    if (!(0, fs_1.existsSync)(drawableFolderPath)) {
        (0, fs_1.mkdirSync)(drawableFolderPath, { recursive: true });
    }
    try {
        const resizedIcon = (await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: 'expo-video-android-icon' }, {
            src: icon,
            width: BASELINE_PIXEL_SIZE,
            height: BASELINE_PIXEL_SIZE,
            resizeMode: 'cover',
            backgroundColor: 'transparent',
        })).source;
        const originalIconName = (0, path_1.basename)(icon);
        const iconFilename = `${EXPO_VIDEO_ICON_PREFIX}${originalIconName}`;
        (0, fs_1.writeFileSync)((0, path_1.resolve)(drawableFolderPath, iconFilename), resizedIcon);
    }
    catch (e) {
        throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue resizing icon: ' + e);
    }
}
async function removeIconImageFiles(projectRoot) {
    const drawableFolderPath = (0, path_1.resolve)(projectRoot, ANDROID_DRAWABLE_PATH);
    if (!(0, fs_1.existsSync)(drawableFolderPath)) {
        return;
    }
    (0, fs_1.readdirSync)(drawableFolderPath).forEach((file) => {
        if (file.startsWith(EXPO_VIDEO_ICON_PREFIX)) {
            (0, fs_1.unlinkSync)((0, path_1.resolve)(drawableFolderPath, file));
        }
    });
}
const withIcons = (config, { icons = [] }) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            if (icons.length) {
                await Promise.all(icons.map((icon) => writeIconAsync(icon, config.modRequest.projectRoot)));
            }
            else {
                await removeIconImageFiles(config.modRequest.projectRoot);
            }
            return config;
        },
    ]);
};
exports.withIcons = withIcons;
