"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
const withExpoImage = (config, props) => {
    const disableLibdav1d = props?.disableLibdav1d ?? false;
    return (0, config_plugins_1.withPodfileProperties)(config, (config) => {
        config.modResults['expo-image.disable-libdav1d'] = disableLibdav1d ? 'true' : 'false';
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withExpoImage, pkg.name, pkg.version);
