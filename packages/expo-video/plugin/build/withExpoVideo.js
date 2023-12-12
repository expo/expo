"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withExpoVideo = (config) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
        if (!currentBackgroundModes.includes('audio')) {
            config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
        }
        return config;
    });
    return config;
};
exports.default = withExpoVideo;
