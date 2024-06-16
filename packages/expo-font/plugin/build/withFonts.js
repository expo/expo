"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withFontsAndroid_1 = require("./withFontsAndroid");
const withFontsIos_1 = require("./withFontsIos");
const pkg = require('expo-font/package.json');
const withFonts = (config, props) => {
    if (!props) {
        return config;
    }
    if (props.fonts && props.fonts.length === 0) {
        return config;
    }
    config = (0, withFontsIos_1.withFontsIos)(config, props.fonts ?? []);
    config = (0, withFontsAndroid_1.withFontsAndroid)(config, props.fonts ?? []);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFonts, pkg.name, pkg.version);
