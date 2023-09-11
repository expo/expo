"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Manifest_1 = require("@expo/config-plugins/build/android/Manifest");
const config_plugins_1 = require("expo/config-plugins");
function withExpoLocalizationIos(config) {
    if (config.extra?.supportsRTL == null)
        return config;
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.ExpoLocalization_supportsRTL = config.extra?.supportsRTL || false;
    return config;
}
function withExpoLocalizationAndroid(config, data) {
    if (data.allowDynamicLocaleChangesAndroid) {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const mainActivity = (0, Manifest_1.getMainActivityOrThrow)(config.modResults);
            if (!mainActivity.$['android:configChanges']?.includes('locale')) {
                mainActivity.$['android:configChanges'] += '|locale';
            }
            if (!mainActivity.$['android:configChanges']?.includes('layoutDirection')) {
                mainActivity.$['android:configChanges'] += '|layoutDirection';
            }
            return config;
        });
    }
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = config_plugins_1.AndroidConfig.Strings.setStringItem([
            {
                $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' },
                _: String(data.supportsRTL ?? config.extra?.supportsRTL),
            },
        ], config.modResults);
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
