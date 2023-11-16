"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNotificationIconColor = exports.setNotificationConfig = exports.setNotificationIconAsync = exports.getNotificationColor = exports.getNotificationIcon = exports.withNotificationManifest = exports.withNotificationIconColor = exports.withNotificationIcons = exports.NOTIFICATION_ICON_COLOR_RESOURCE = exports.NOTIFICATION_ICON_COLOR = exports.NOTIFICATION_ICON_RESOURCE = exports.NOTIFICATION_ICON = exports.META_DATA_NOTIFICATION_ICON_COLOR = exports.META_DATA_NOTIFICATION_ICON = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const image_utils_1 = require("@expo/image-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const withAndroidIcons_1 = require("../../icons/withAndroidIcons");
const { Colors } = config_plugins_1.AndroidConfig;
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const BASELINE_PIXEL_SIZE = 24;
exports.META_DATA_NOTIFICATION_ICON = 'expo.modules.notifications.default_notification_icon';
exports.META_DATA_NOTIFICATION_ICON_COLOR = 'expo.modules.notifications.default_notification_color';
exports.NOTIFICATION_ICON = 'notification_icon';
exports.NOTIFICATION_ICON_RESOURCE = `@drawable/${exports.NOTIFICATION_ICON}`;
exports.NOTIFICATION_ICON_COLOR = 'notification_icon_color';
exports.NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${exports.NOTIFICATION_ICON_COLOR}`;
const withNotificationIcons = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setNotificationIconAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withNotificationIcons = withNotificationIcons;
const withNotificationIconColor = (config) => {
    return (0, config_plugins_1.withAndroidColors)(config, (config) => {
        config.modResults = setNotificationIconColor(config, config.modResults);
        return config;
    });
};
exports.withNotificationIconColor = withNotificationIconColor;
const withNotificationManifest = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setNotificationConfig(config, config.modResults);
        return config;
    });
};
exports.withNotificationManifest = withNotificationManifest;
function getNotificationIcon(config) {
    return config.notification?.icon || null;
}
exports.getNotificationIcon = getNotificationIcon;
function getNotificationColor(config) {
    return config.notification?.color || null;
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
function setNotificationConfig(config, manifest) {
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
exports.setNotificationConfig = setNotificationConfig;
function setNotificationIconColor(config, colors) {
    return Colors.assignColorValue(colors, {
        name: exports.NOTIFICATION_ICON_COLOR,
        value: getNotificationColor(config),
    });
}
exports.setNotificationIconColor = setNotificationIconColor;
async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
    await Promise.all(Object.values(withAndroidIcons_1.dpiValues).map(async ({ folderName, scale }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.default.resolve(projectRoot, withAndroidIcons_1.ANDROID_RES_PATH, drawableFolderName);
        await fs_extra_1.default.ensureDir(dpiFolderPath);
        const iconSizePx = BASELINE_PIXEL_SIZE * scale;
        try {
            const resizedIcon = (await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: 'android-notification' }, {
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
    await Promise.all(Object.values(withAndroidIcons_1.dpiValues).map(async ({ folderName }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = path_1.default.resolve(projectRoot, withAndroidIcons_1.ANDROID_RES_PATH, drawableFolderName);
        await fs_extra_1.default.remove(path_1.default.resolve(dpiFolderPath, exports.NOTIFICATION_ICON + '.png'));
    }));
}
