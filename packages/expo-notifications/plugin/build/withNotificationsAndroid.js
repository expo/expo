"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationsAndroid = exports.setNotificationIconColorAsync = exports.setNotificationConfigAsync = exports.setNotificationIconAsync = exports.getNotificationColor = exports.getNotificationIcon = exports.withNotificationManifest = exports.withNotificationIconColor = exports.withNotificationIcons = exports.NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const Resources_1 = require("@expo/config-plugins/build/android/Resources");
const XML_1 = require("@expo/config-plugins/build/android/XML");
const android_plugins_1 = require("@expo/config-plugins/build/plugins/android-plugins");
const image_utils_1 = require("@expo/image-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const { Colors } = config_plugins_1.AndroidConfig;
const { ANDROID_RES_PATH, dpiValues } = config_plugins_1.AndroidConfig.Icon;
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const BASELINE_PIXEL_SIZE = 24;
exports.META_DATA_NOTIFICATION_ICON = 'expo.modules.notifications.default_notification_icon';
exports.META_DATA_NOTIFICATION_ICON_COLOR = 'expo.modules.notifications.default_notification_color';
exports.NOTIFICATION_ICON = 'notification_icon';
exports.NOTIFICATION_ICON_RESOURCE = `@drawable/${exports.NOTIFICATION_ICON}`;
exports.NOTIFICATION_ICON_COLOR = 'notification_icon_color';
exports.NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${exports.NOTIFICATION_ICON_COLOR}`;
exports.withNotificationIcons = config => {
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationIconAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withNotificationIconColor = config => {
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setNotificationIconColorAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withNotificationManifest = android_plugins_1.createAndroidManifestPlugin(setNotificationConfigAsync, 'withNotificationManifest');
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
 * Applies configuration for expo-notifications, including
 * the notification icon and notification color.
 */
async function setNotificationIconAsync(config, projectRoot) {
    const icon = getNotificationIcon(config);
    if (icon) {
        await writeNotificationIconImageFilesAsync(icon, projectRoot);
    }
    else {
        await removeNotificationIconImageFilesAsync(projectRoot);
    }
}
exports.setNotificationIconAsync = setNotificationIconAsync;
async function setNotificationConfigAsync(config, manifest) {
    const icon = getNotificationIcon(config);
    const color = getNotificationColor(config);
    const mainApplication = getMainApplicationOrThrow(manifest);
    if (icon) {
        addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON, exports.NOTIFICATION_ICON_RESOURCE, 'resource');
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON);
    }
    if (color) {
        addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON_COLOR, exports.NOTIFICATION_ICON_COLOR_RESOURCE, 'resource');
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_NOTIFICATION_ICON_COLOR);
    }
    return manifest;
}
exports.setNotificationConfigAsync = setNotificationConfigAsync;
async function setNotificationIconColorAsync(config, projectRoot) {
    const color = getNotificationColor(config);
    const colorsXmlPath = await Colors.getProjectColorsXMLPathAsync(projectRoot);
    let colorsJson = await Resources_1.readResourcesXMLAsync({ path: colorsXmlPath });
    if (color) {
        const colorItemToAdd = Resources_1.buildResourceItem({ name: exports.NOTIFICATION_ICON_COLOR, value: color });
        colorsJson = Colors.setColorItem(colorItemToAdd, colorsJson);
    }
    else {
        colorsJson = Colors.removeColorItem(exports.NOTIFICATION_ICON_COLOR, colorsJson);
    }
    await XML_1.writeXMLAsync({ path: colorsXmlPath, xml: colorsJson });
}
exports.setNotificationIconColorAsync = setNotificationIconColorAsync;
async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
    await Promise.all(Object.values(dpiValues).map(async ({ folderName, scale }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.default.resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
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
    await Promise.all(Object.values(dpiValues).map(async ({ folderName }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.default.resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
        await fs_extra_1.default.remove(path_1.default.resolve(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'));
    }));
}
exports.withNotificationsAndroid = config => {
    config = exports.withNotificationIconColor(config);
    config = exports.withNotificationIcons(config);
    config = exports.withNotificationManifest(config);
    return config;
};
