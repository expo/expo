"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withForegroundServiceIcon = exports.META_DATA_FOREGROUND_SERVICE_ICON = exports.FOREGROUND_SERVICE_ICON_RESOURCE = exports.FOREGROUND_SERVICE_ICON = exports.dpiValues = exports.ANDROID_RES_PATH = void 0;
exports.setForegroundServiceIconAsync = setForegroundServiceIconAsync;
const image_utils_1 = require("@expo/image-utils");
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = require("fs");
const path_1 = require("path");
const pkg = require('expo-location/package.json');
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';
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
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android location. ';
exports.FOREGROUND_SERVICE_ICON = 'location_foreground_service_icon';
exports.FOREGROUND_SERVICE_ICON_RESOURCE = `@drawable/${exports.FOREGROUND_SERVICE_ICON}`;
exports.META_DATA_FOREGROUND_SERVICE_ICON = 'expo.modules.location.foreground_service_icon';
const withBackgroundLocation = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (!Array.isArray(config.modResults.UIBackgroundModes)) {
            config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes('location')) {
            config.modResults.UIBackgroundModes.push('location');
        }
        return config;
    });
};
const withForegroundServiceIcon = (config, { icon }) => {
    // Update icon assets
    const configWithIconAssets = (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setForegroundServiceIconAsync(config.modRequest.projectRoot, icon);
            return config;
        },
    ]);
    // Update assets Android manifest
    return (0, config_plugins_1.withAndroidManifest)(configWithIconAssets, (config) => {
        const manifest = config.modResults;
        const mainApplication = getMainApplicationOrThrow(manifest);
        if (icon) {
            addMetaDataItemToMainApplication(mainApplication, exports.META_DATA_FOREGROUND_SERVICE_ICON, exports.FOREGROUND_SERVICE_ICON_RESOURCE, 'resource');
        }
        else {
            removeMetaDataItemFromMainApplication(mainApplication, exports.META_DATA_FOREGROUND_SERVICE_ICON);
        }
        config.modResults = manifest;
        return config;
    });
};
exports.withForegroundServiceIcon = withForegroundServiceIcon;
/**
 * Applies foreground service icon configuration for expo-location
 */
async function setForegroundServiceIconAsync(projectRoot, icon) {
    if (icon) {
        await writeForegroundServiceIconImageFilesAsync(icon, projectRoot);
    }
    else {
        removeForegroundServiceIconImageFiles(projectRoot);
    }
}
async function writeForegroundServiceIconImageFilesAsync(icon, projectRoot) {
    await Promise.all(Object.values(exports.dpiValues).map(async ({ folderName, scale }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = (0, path_1.resolve)(projectRoot, exports.ANDROID_RES_PATH, drawableFolderName);
        if (!(0, fs_1.existsSync)(dpiFolderPath)) {
            (0, fs_1.mkdirSync)(dpiFolderPath, { recursive: true });
        }
        const iconSizePx = BASELINE_PIXEL_SIZE * scale;
        try {
            const resizedIcon = (await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: 'android-location' }, {
                src: icon,
                width: iconSizePx,
                height: iconSizePx,
                resizeMode: 'cover',
                backgroundColor: 'transparent',
            })).source;
            (0, fs_1.writeFileSync)((0, path_1.resolve)(dpiFolderPath, exports.FOREGROUND_SERVICE_ICON + '.png'), resizedIcon);
        }
        catch (e) {
            throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue resizing Android foreground service icon: ' + e);
        }
    }));
}
function removeForegroundServiceIconImageFiles(projectRoot) {
    Object.values(exports.dpiValues).forEach(async ({ folderName }) => {
        const drawableFolderName = folderName.replace('mipmap', 'drawable');
        const dpiFolderPath = (0, path_1.resolve)(projectRoot, exports.ANDROID_RES_PATH, drawableFolderName);
        const iconFile = (0, path_1.resolve)(dpiFolderPath, exports.FOREGROUND_SERVICE_ICON + '.png');
        if ((0, fs_1.existsSync)(iconFile)) {
            (0, fs_1.unlinkSync)(iconFile);
        }
    });
}
const withLocation = (config, { locationAlwaysAndWhenInUsePermission, locationAlwaysPermission, locationWhenInUsePermission, isIosBackgroundLocationEnabled, isAndroidBackgroundLocationEnabled, isAndroidForegroundServiceEnabled, androidForegroundServiceIcon, } = {}) => {
    if (isIosBackgroundLocationEnabled) {
        config = withBackgroundLocation(config);
    }
    config = (0, exports.withForegroundServiceIcon)(config, { icon: androidForegroundServiceIcon ?? null });
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSLocationAlwaysAndWhenInUseUsageDescription: LOCATION_USAGE,
        NSLocationAlwaysUsageDescription: LOCATION_USAGE,
        NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
    })(config, {
        NSLocationAlwaysAndWhenInUseUsageDescription: locationAlwaysAndWhenInUsePermission,
        NSLocationAlwaysUsageDescription: locationAlwaysPermission,
        NSLocationWhenInUseUsageDescription: locationWhenInUsePermission,
    });
    // If the user has not specified a value for isAndroidForegroundServiceEnabled,
    // we default to the value of isAndroidBackgroundLocationEnabled because we want
    // to enable foreground by default if background location is enabled.
    const enableAndroidForegroundService = typeof isAndroidForegroundServiceEnabled === 'undefined'
        ? isAndroidBackgroundLocationEnabled
        : isAndroidForegroundServiceEnabled;
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        // Note: these are already added in the library AndroidManifest.xml and so
        // are not required here, we may want to remove them in the future.
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        // These permissions are optional, and not listed in the library AndroidManifest.xml
        isAndroidBackgroundLocationEnabled && 'android.permission.ACCESS_BACKGROUND_LOCATION',
        enableAndroidForegroundService && 'android.permission.FOREGROUND_SERVICE',
        enableAndroidForegroundService && 'android.permission.FOREGROUND_SERVICE_LOCATION',
    ].filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withLocation, pkg.name, pkg.version);
