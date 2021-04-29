"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationsAndroid = exports.setNotificationSoundsAsync = exports.setNotificationIconColorAsync = exports.setNotificationConfigAsync = exports.setNotificationIconAsync = exports.getNotificationColor = exports.getNotificationIcon = exports.withNotificationSounds = exports.withNotificationManifest = exports.withNotificationIconColor = exports.withNotificationIcons = exports.NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON = exports.dpiValues = exports.ANDROID_RES_PATH = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const image_utils_1 = require("@expo/image-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const { buildResourceItem, readResourcesXMLAsync } = config_plugins_1.AndroidConfig.Resources;
const { writeXMLAsync } = config_plugins_1.XML;
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
exports.META_DATA_NOTIFICATION_ICON = 'expo.modules.notifications.default_notification_icon';
exports.META_DATA_NOTIFICATION_ICON_COLOR = 'expo.modules.notifications.default_notification_color';
exports.NOTIFICATION_ICON = 'notification_icon';
exports.NOTIFICATION_ICON_RESOURCE = `@drawable/${exports.NOTIFICATION_ICON}`;
exports.NOTIFICATION_ICON_COLOR = 'notification_icon_color';
exports.NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${exports.NOTIFICATION_ICON_COLOR}`;
exports.withNotificationIcons = (config, { icon }) => {
    // If no icon provided in the config plugin props, fallback to value from app.json
    icon = icon || getNotificationIcon(config);
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationIconAsync(icon, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withNotificationIconColor = (config, { color }) => {
    // If no color provided in the config plugin props, fallback to value from app.json
    color = color || getNotificationColor(config);
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationIconColorAsync(color, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withNotificationManifest = (config, { icon, color }) => {
    // If no icon or color provided in the config plugin props, fallback to value from app.json
    icon = icon || getNotificationIcon(config);
    color = color || getNotificationColor(config);
    return config_plugins_1.withAndroidManifest(config, async (config) => {
        config.modResults = await setNotificationConfigAsync({ icon, color }, config.modResults);
        return config;
    });
};
exports.withNotificationSounds = (config, { sounds }) => {
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationSoundsAsync(sounds, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
function getNotificationIcon(config) {
    var _a;
    return ((_a = config.notification) === null || _a === void 0 ? void 0 : _a.icon) || null;
}
exports.getNotificationIcon = getNotificationIcon;
function getNotificationColor(config) {
    var _a;
    return ((_a = config.notification) === null || _a === void 0 ? void 0 : _a.color) || null;
}
exports.getNotificationColor = getNotificationColor;
/**
 * Applies notification icon configuration for expo-notifications
 */
async function setNotificationIconAsync(icon, projectRoot) {
    if (icon) {
        await writeNotificationIconImageFilesAsync(icon, projectRoot);
    }
    else {
        await removeNotificationIconImageFilesAsync(projectRoot);
    }
}
exports.setNotificationIconAsync = setNotificationIconAsync;
async function setNotificationConfigAsync(props, manifest) {
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
exports.setNotificationConfigAsync = setNotificationConfigAsync;
async function setNotificationIconColorAsync(color, projectRoot) {
    const colorsXmlPath = await Colors.getProjectColorsXMLPathAsync(projectRoot);
    let colorsJson = await readResourcesXMLAsync({ path: colorsXmlPath });
    if (color) {
        const colorItemToAdd = buildResourceItem({ name: exports.NOTIFICATION_ICON_COLOR, value: color });
        colorsJson = Colors.setColorItem(colorItemToAdd, colorsJson);
    }
    else {
        colorsJson = Colors.removeColorItem(exports.NOTIFICATION_ICON_COLOR, colorsJson);
    }
    await writeXMLAsync({ path: colorsXmlPath, xml: colorsJson });
}
exports.setNotificationIconColorAsync = setNotificationIconColorAsync;
async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
    await Promise.all(Object.values(exports.dpiValues).map(async ({ folderName, scale }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.default.resolve(projectRoot, exports.ANDROID_RES_PATH, drawableFolderName);
        await fs_extra_1.default.ensureDir(dpiFolderPath);
        const iconSizePx = BASELINE_PIXEL_SIZE * scale;
        try {
            const resizedIcon = (await image_utils_1.generateImageAsync({ projectRoot, cacheType: 'android-notification' }, {
                src: icon,
                width: iconSizePx,
                height: iconSizePx,
                resizeMode: 'cover',
                backgroundColor: 'transparent',
            })).source;
            await fs_extra_1.default.writeFile(path_1.default.resolve(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'), resizedIcon);
        }
        catch (e) {
            throw new Error('Encountered an issue resizing Android notification icon: ' + e);
        }
    }));
}
async function removeNotificationIconImageFilesAsync(projectRoot) {
    await Promise.all(Object.values(exports.dpiValues).map(async ({ folderName }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.default.resolve(projectRoot, exports.ANDROID_RES_PATH, drawableFolderName);
        await fs_extra_1.default.remove(path_1.default.resolve(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'));
    }));
}
/**
 * Save sound files to <project-root>/android/app/src/main/res/raw
 */
async function setNotificationSoundsAsync(sounds, projectRoot) {
    if (!Array.isArray(sounds)) {
        throw new Error(`Must provide an array of sound files in your app config, found ${typeof sounds}.`);
    }
    await Promise.all(sounds.map(async (soundFileRelativePath) => {
        await writeNotificationSoundFileAsync(soundFileRelativePath, projectRoot);
    }));
}
exports.setNotificationSoundsAsync = setNotificationSoundsAsync;
/**
 * Copies the input file to the <project-root>/android/app/src/main/res/raw directory if
 * there isn't already an existing file under that name.
 */
async function writeNotificationSoundFileAsync(soundFileRelativePath, projectRoot) {
    const rawResourcesPath = path_1.default.resolve(projectRoot, exports.ANDROID_RES_PATH, 'raw');
    const inputFilename = path_1.default.basename(soundFileRelativePath);
    if (inputFilename) {
        try {
            const sourceFilepath = path_1.default.resolve(projectRoot, soundFileRelativePath);
            const destinationFilepath = path_1.default.resolve(rawResourcesPath, inputFilename);
            await fs_extra_1.default.ensureDir(rawResourcesPath);
            await fs_extra_1.default.copyFile(sourceFilepath, destinationFilepath);
        }
        catch (e) {
            throw new Error('Encountered an issue copying Android notification sounds: ' + e);
        }
    }
}
exports.withNotificationsAndroid = (config, { icon = null, color = null, sounds = [] }) => {
    config = exports.withNotificationIconColor(config, { color });
    config = exports.withNotificationIcons(config, { icon });
    config = exports.withNotificationManifest(config, { icon, color });
    config = exports.withNotificationSounds(config, { sounds });
    return config;
};
