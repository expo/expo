"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const createLegacyPlugin_1 = require("./createLegacyPlugin");
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-document-picker',
    fallback(config) {
        if (config.ios?.usesIcloudStorage) {
            config_plugins_1.WarningAggregator.addWarningIOS('ios.usesIcloudStorage', 'Install expo-document-picker to enable the ios.usesIcloudStorage feature'
            // TODO: add a link to a docs page with more information on how to do this
            );
        }
        return config;
    },
});
