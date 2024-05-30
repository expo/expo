"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationsAndroid = exports.setNotificationSounds = exports.setNotificationIconAsync = exports.setNotificationIconColor = exports.getNotificationColor = exports.getNotificationIcon = exports.withNotificationSounds = exports.withNotificationManifest = exports.withNotificationIconColor = exports.withNotificationIcons = exports.NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON = exports.dpiValues = exports.ANDROID_RES_PATH = void 0;
const image_utils_1 = require("@expo/image-utils");
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = require("fs");
const path_1 = require("path");
const { Colors } = config_plugins_1.AndroidConfig;
exports.ANDROID_RES_PATH = 'android/app/src/main/res/';
exports.dpiValues = {
    mdpi: { folderName: 'mipmap-mdpi', scale: 1 },
    hdpi: { folderName: 'mipmap-hdpi', scale: 1.5 },
    xhdpi: { folderName: 'mipmap-xhdpi', scale: 2 },
    xxhdpi: { folderName: 'mipmap-xxhdpi', scale: 3 },
    xxxhdpi: { folderName: 'mipmap-xxxhdpi', scale: 4 },
};
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const BASELINE_PIXEL_SIZE = 24;
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android notifications. ';
exports.META_DATA_NOTIFICATION_ICON = 'com.google.firebase.messaging.default_notification_icon';
exports.META_DATA_NOTIFICATION_ICON_COLOR = 'com.google.firebase.messaging.default_notification_color';
exports.NOTIFICATION_ICON = 'notification_icon';
exports.NOTIFICATION_ICON_RESOURCE = `@drawable/${exports.NOTIFICATION_ICON}`;
exports.NOTIFICATION_ICON_COLOR = 'notification_icon_color';
exports.NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${exports.NOTIFICATION_ICON_COLOR}`;
const withNotificationIcons = (config, { icon }) => {
    // If no icon provided in the config plugin props, fallback to value from app.json
    icon = icon || getNotificationIcon(config);
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setNotificationIconAsync(config.modRequest.projectRoot, icon);
            return config;
        },
    ]);
};
exports.withNotificationIcons = withNotificationIcons;
const withNotificationIconColor = (config, { color }) => {
    // If no color provided in the config plugin props, fallback to value from app.json
    return (0, config_plugins_1.withAndroidColors)(config, (config) => {
        color = color || getNotificationColor(config);
        config.modResults = setNotificationIconColor(color, config.modResults);
        return config;
    });
};
exports.withNotificationIconColor = withNotificationIconColor;
const withNotificationManifest = (config, { icon, color }) => {
    // If no icon or color provided in the config plugin props, fallback to value from app.json
    icon = icon || getNotificationIcon(config);
    color = color || getNotificationColor(config);
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setNotificationConfig({ icon, color }, config.modResults);
        return config;
    });
};
exports.withNotificationManifest = withNotificationManifest;
const withNotificationSounds = (config, { sounds }) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        (config) => {
            setNotificationSounds(config.modRequest.projectRoot, sounds);
            return config;
        },
    ]);
};
exports.withNotificationSounds = withNotificationSounds;
function getNotificationIcon(config) {
    return config.notification?.icon || null;
}
exports.getNotificationIcon = getNotificationIcon;
function getNotificationColor(config) {
    return config.notification?.color || null;
}
exports.getNotificationColor = getNotificationColor;
function setNotificationIconColor(color, colors) {
    return Colors.assignColorValue(colors, {
        name: exports.NOTIFICATION_ICON_COLOR,
        value: color,
    });
}
exports.setNotificationIconColor = setNotificationIconColor;
/**
 * Applies notification icon configuration for expo-notifications
 */
async function setNotificationIconAsync(projectRoot, icon) {
    if (icon) {
        await writeNotificationIconImageFilesAsync(icon, projectRoot);
    }
    else {
        removeNotificationIconImageFiles(projectRoot);
    }
}
exports.setNotificationIconAsync = setNotificationIconAsync;
function setNotificationConfig(props, manifest) {
    const mainApplication = getMainApplicationOrThrow(manifest);
    if (props.icon) {
        addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON, exports.NOTIFICATION_ICON_RESOURCE, 'resource');
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON);
    }
    if (props.color) {
        addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON_COLOR, exports.NOTIFICATION_ICON_COLOR_RESOURCE, 'resource');
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON_COLOR);
    }
    return manifest;
}
async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
    await Promise.all(Object.values(exports.dpiValues).map(async ({ folderName, scale }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = (0, path_1.resolve)(projectRoot, exports.ANDROID_RES_PATH, drawableFolderName);
        if (!(0, fs_1.existsSync)(dpiFolderPath)) {
            (0, fs_1.mkdirSync)(dpiFolderPath, { recursive: true });
        }
        const iconSizePx = BASELINE_PIXEL_SIZE * scale;
        try {
            const resizedIcon = (await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: 'android-notification' }, {
                src: icon,
                width: iconSizePx,
                height: iconSizePx,
                resizeMode: 'cover',
                backgroundColor: 'transparent',
            })).source;
            (0, fs_1.writeFileSync)((0, path_1.resolve)(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'), resizedIcon);
        }
        catch (e) {
            throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue resizing Android notification icon: ' + e);
        }
    }));
}
function removeNotificationIconImageFiles(projectRoot) {
    Object.values(exports.dpiValues).forEach(async ({ folderName }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = (0, path_1.resolve)(projectRoot, exports.ANDROID_RES_PATH, drawableFolderName);
        const iconFile = (0, path_1.resolve)(dpiFolderPath, exports.NOTIFICATION_ICON + '.png');
        if ((0, fs_1.existsSync)(iconFile)) {
            (0, fs_1.unlinkSync)(iconFile);
        }
    });
}
/**
 * Save sound files to `<project-root>/android/app/src/main/res/raw`
 */
function setNotificationSounds(projectRoot, sounds) {
    if (!Array.isArray(sounds)) {
        throw new Error(ERROR_MSG_PREFIX +
            `Must provide an array of sound files in your app config, found ${typeof sounds}.`);
    }
    for (const soundFileRelativePath of sounds) {
        writeNotificationSoundFile(soundFileRelativePath, projectRoot);
    }
}
exports.setNotificationSounds = setNotificationSounds;
/**
 * Copies the input file to the `<project-root>/android/app/src/main/res/raw` directory if
 * there isn't already an existing file under that name.
 */
function writeNotificationSoundFile(soundFileRelativePath, projectRoot) {
    const rawResourcesPath = (0, path_1.resolve)(projectRoot, exports.ANDROID_RES_PATH, 'raw');
    const inputFilename = (0, path_1.basename)(soundFileRelativePath);
    if (inputFilename) {
        try {
            const sourceFilepath = (0, path_1.resolve)(projectRoot, soundFileRelativePath);
            const destinationFilepath = (0, path_1.resolve)(rawResourcesPath, inputFilename);
            if (!(0, fs_1.existsSync)(rawResourcesPath)) {
                (0, fs_1.mkdirSync)(rawResourcesPath, { recursive: true });
            }
            (0, fs_1.copyFileSync)(sourceFilepath, destinationFilepath);
        }
        catch (e) {
            throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue copying Android notification sounds: ' + e);
        }
    }
}
const withNotificationsAndroid = (config, { icon = null, color = null, sounds = [] }) => {
    config = (0, exports.withNotificationIconColor)(config, { color });
    config = (0, exports.withNotificationIcons)(config, { icon });
    config = (0, exports.withNotificationManifest)(config, { icon, color });
    config = (0, exports.withNotificationSounds)(config, { sounds });
    return config;
};
exports.withNotificationsAndroid = withNotificationsAndroid;
