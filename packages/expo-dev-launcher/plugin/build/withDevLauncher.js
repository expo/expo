"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pluginConfig_1 = require("./pluginConfig");
const pkg = require('expo-dev-launcher/package.json');
exports.default = (0, config_plugins_1.createRunOncePlugin)((config, props = {}) => {
    (0, pluginConfig_1.validateConfig)(props);
    if ((props.ios?.launchModeExperimental || props.launchModeExperimental) === 'launcher') {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            config.modResults['DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE'] = false;
            return config;
        });
    }
    if ((props.android?.launchModeExperimental || props.launchModeExperimental) === 'launcher') {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
            config_plugins_1.AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE', false?.toString());
            return config;
        });
    }
    return config;
}, pkg.name, pkg.version);
