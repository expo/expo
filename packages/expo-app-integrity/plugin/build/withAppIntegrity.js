"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-app-integrity/package.json');
const withAppIntegrity = (config, { cloudProjectNumber } = {}) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            console.log({ modResults: config.modResults });
            return config;
        },
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAppIntegrity, pkg.name, pkg.version);
