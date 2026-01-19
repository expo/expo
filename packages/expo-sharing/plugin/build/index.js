"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const parseIntentFilters_1 = require("./android/parseIntentFilters");
const withAndroidIntentFilters_1 = require("./android/withAndroidIntentFilters");
const withShareIntoSchemeString_1 = require("./android/withShareIntoSchemeString");
const withAppGroupId_1 = require("./ios/withAppGroupId");
const withShareExtensionFiles_1 = require("./ios/withShareExtensionFiles");
const withShareExtensionXcodeProject_1 = require("./ios/withShareExtensionXcodeProject");
const withConfig_1 = require("./withConfig");
const EXPO_SHARE_EXTENSION_TARGET_NAME = 'expo-sharing-extension';
const pkg = require('expo-sharing/package.json');
const withShareExtension = (config, props) => {
    let plugins = [];
    const iosEnabled = props?.ios?.enabled ?? true;
    const androidEnabled = props?.android?.enabled ?? true;
    if (iosEnabled) {
        const deploymentTarget = '15.1';
        const bundleIdentifier = config.ios?.bundleIdentifier;
        if (!bundleIdentifier) {
            throw new Error("The application config doesn't define a bundle identifier. Make sure that `ios.bundleIdentifier` field has a value.");
        }
        const extensionBundleIdentifier = props?.ios?.extensionBundleIdentifier ??
            `${config.ios?.bundleIdentifier}.${EXPO_SHARE_EXTENSION_TARGET_NAME}`;
        const fallbackAppGroupId = `group.${bundleIdentifier}`;
        const appGroupId = props?.ios?.appGroupId ?? fallbackAppGroupId;
        const urlScheme = (config.scheme ?? bundleIdentifier); // TODO: Fix this type;
        const activationRule = props?.ios?.activationRule ?? {
            supportsText: true,
            supportsWebUrlWithMaxCount: 1,
        };
        if (!urlScheme) {
            throw new Error(`Expo sharing: The app doesn't define a scheme or a bundle identifier. Define at least one of those properties in app json`);
        }
        if (!props?.ios?.appGroupId) {
            console.warn(`Expo sharing: Using the default ${fallbackAppGroupId} app group id. If you are using EAS Build` +
                ` no further steps are required, otherwise make sure that this app group is registered` +
                ` with your Apple development team, or set \`ios.appGroupId\` field to an already registered app group.`);
        }
        const shareExtensionFiles = {};
        plugins = [
            ...plugins,
            [
                withConfig_1.withConfig,
                {
                    bundleIdentifier: extensionBundleIdentifier,
                    targetName: EXPO_SHARE_EXTENSION_TARGET_NAME,
                    groupIdentifier: appGroupId,
                },
            ],
            [withAppGroupId_1.withAppGroupId, appGroupId],
            [
                withShareExtensionFiles_1.withShareExtensionFiles,
                {
                    targetName: EXPO_SHARE_EXTENSION_TARGET_NAME,
                    appGroupId,
                    urlScheme,
                    activationRule,
                    onFilesWritten: (writtenFiles) => {
                        Object.assign(shareExtensionFiles, writtenFiles);
                    },
                },
            ],
            [
                withShareExtensionXcodeProject_1.withShareExtensionXcodeProject,
                {
                    targetName: EXPO_SHARE_EXTENSION_TARGET_NAME,
                    bundleIdentifier: extensionBundleIdentifier,
                    deploymentTarget,
                    activationRule,
                    shareExtensionFiles,
                },
            ],
        ];
    }
    if (androidEnabled) {
        const urlScheme = config.scheme ?? config.android?.package;
        if (!urlScheme) {
            throw new Error("The application config doesn't define a scheme or an Android package. Define the scheme in the app config.");
        }
        const singleIntentFilter = (0, parseIntentFilters_1.parseIntentFilters)(props?.android?.singleShareMimeTypes ?? [], 'single');
        const multiIntentFilter = (0, parseIntentFilters_1.parseIntentFilters)(props?.android?.multipleShareMimeTypes ?? [], 'multiple');
        plugins = [
            ...plugins,
            [
                withAndroidIntentFilters_1.withAndroidIntentFilters,
                {
                    intentFilters: [singleIntentFilter, multiIntentFilter],
                },
            ],
            [withShareIntoSchemeString_1.withShareIntoSchemeString, urlScheme],
        ];
    }
    return (0, config_plugins_1.withPlugins)(config, plugins);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withShareExtension, pkg.name, pkg.version);
