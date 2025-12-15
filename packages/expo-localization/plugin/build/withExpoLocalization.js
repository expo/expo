"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function withExpoLocalizationIos(config, data) {
    const mergedConfig = { ...config.extra, ...data };
    const supportedLocales = typeof mergedConfig.supportedLocales === 'object' &&
        !Array.isArray(mergedConfig.supportedLocales)
        ? mergedConfig.supportedLocales.ios
        : mergedConfig.supportedLocales;
    if (mergedConfig?.supportsRTL == null &&
        mergedConfig?.forcesRTL == null &&
        supportedLocales == null)
        return config;
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    if (mergedConfig?.supportsRTL != null) {
        config.ios.infoPlist.ExpoLocalization_supportsRTL = mergedConfig?.supportsRTL;
    }
    if (mergedConfig?.forcesRTL != null) {
        config.ios.infoPlist.ExpoLocalization_forcesRTL = mergedConfig?.forcesRTL;
    }
    if (supportedLocales != null) {
        config.ios.infoPlist.CFBundleLocalizations = supportedLocales;
    }
    return config;
}
function withExpoLocalizationAndroid(config, data) {
    if (data.allowDynamicLocaleChangesAndroid) {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const mainActivity = config_plugins_1.AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
            if (!mainActivity.$['android:configChanges']?.includes('locale')) {
                mainActivity.$['android:configChanges'] += '|locale';
            }
            if (!mainActivity.$['android:configChanges']?.includes('layoutDirection')) {
                mainActivity.$['android:configChanges'] += '|layoutDirection';
            }
            return config;
        });
    }
    const mergedConfig = { ...config.extra, ...data };
    const supportedLocales = typeof mergedConfig.supportedLocales === 'object' &&
        !Array.isArray(mergedConfig.supportedLocales)
        ? mergedConfig.supportedLocales.android
        : mergedConfig.supportedLocales;
    if (supportedLocales) {
        config = (0, config_plugins_1.withDangerousMod)(config, [
            'android',
            (config) => {
                const projectRootPath = path_1.default.join(config.modRequest.platformProjectRoot);
                const folder = path_1.default.join(projectRootPath, 'app/src/main/res/xml');
                fs_1.default.mkdirSync(folder, { recursive: true });
                fs_1.default.writeFileSync(path_1.default.join(folder, 'locales_config.xml'), [
                    '<?xml version="1.0" encoding="utf-8"?>',
                    '<locale-config xmlns:android="http://schemas.android.com/apk/res/android">',
                    ...supportedLocales.map((locale) => `  <locale android:name="${locale}"/>`),
                    '</locale-config>',
                ].join('\n'));
                return config;
            },
        ]);
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
            mainApplication.$ = {
                ...mainApplication.$,
                'android:localeConfig': '@xml/locales_config',
            };
            return config;
        });
        config = (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
            if (config.modResults.language === 'groovy') {
                config.modResults.contents = config_plugins_1.AndroidConfig.CodeMod.appendContentsInsideDeclarationBlock(config.modResults.contents, 'defaultConfig', `    resourceConfigurations += [${supportedLocales.map((lang) => `"${lang}"`).join(', ')}]\n    `);
            }
            else {
                config_plugins_1.WarningAggregator.addWarningAndroid('expo-localization supportedLocales', `Cannot automatically configure app build.gradle if it's not groovy`);
            }
            return config;
        });
    }
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        if (mergedConfig?.supportsRTL != null) {
            config.modResults = config_plugins_1.AndroidConfig.Strings.setStringItem([
                {
                    $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' },
                    _: String(mergedConfig?.supportsRTL ?? 'unset'),
                },
            ], config.modResults);
        }
        if (mergedConfig?.forcesRTL != null) {
            config.modResults = config_plugins_1.AndroidConfig.Strings.setStringItem([
                {
                    $: { name: 'ExpoLocalization_forcesRTL', translatable: 'false' },
                    _: String(mergedConfig?.forcesRTL ?? 'unset'),
                },
            ], config.modResults);
        }
        return config;
    });
}
function withExpoLocalization(config, data = {
    allowDynamicLocaleChangesAndroid: true,
}) {
    return (0, config_plugins_1.withPlugins)(config, [
        [withExpoLocalizationIos, data],
        [withExpoLocalizationAndroid, data],
    ]);
}
exports.default = withExpoLocalization;
