"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAssetsAndroid_1 = require("./withAssetsAndroid");
const withAssetsIos_1 = require("./withAssetsIos");
const pkg = require('expo-asset/package.json');
const withAssets = (config, props) => {
    if (!props) {
        return config;
    }
    if (props.assets && props.assets.length === 0) {
        return config;
    }
    config = (0, withAssetsIos_1.withAssetsIos)(config, props.assets ?? []);
    config = (0, withAssetsAndroid_1.withAssetsAndroid)(config, props.assets ?? []);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAssets, pkg.name, pkg.version);
