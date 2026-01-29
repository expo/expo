"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const common_1 = require("../../common");
const withGradlePropertiesPlugin = (config) => {
    return (0, config_plugins_1.withGradleProperties)(config, (config) => {
        if ((0, common_1.checkPlugin)(config, 'expo-dev-menu')) {
            const devMenuReleaseConfiguration = getDevMenuReleaseConfiguration();
            if (!devMenuReleaseConfiguration.some((item) => config.modResults.includes(item))) {
                config.modResults = [...config.modResults, ...devMenuReleaseConfiguration];
            }
        }
        return config;
    });
};
const getDevMenuReleaseConfiguration = () => {
    return [
        {
            type: 'comment',
            value: 'Enables expo-dev-menu in release builds',
        },
        {
            type: 'comment',
            value: 'This enables compilation of `Release` and `All` variants in brownfield setup',
        },
        {
            type: 'property',
            key: 'expo.devmenu.configureInRelease',
            value: 'true',
        },
    ];
};
exports.default = withGradlePropertiesPlugin;
