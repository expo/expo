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
    const iosFonts = [...(props.fonts ?? []), ...(props.ios?.fonts ?? [])];
    if (iosFonts.length > 0) {
        config = (0, withFontsIos_1.withFontsIos)(config, iosFonts);
    }
    const xmlFonts = props.android?.fonts?.filter((item) => typeof item !== 'string') ?? [];
    const assetFonts = [
        ...(props.fonts ?? []),
        ...(props.android?.fonts?.filter((item) => typeof item === 'string') ?? []),
    ];
    if (xmlFonts.length > 0) {
        config = (0, withFontsAndroid_1.withXmlFontsAndroid)(config, xmlFonts);
    }
    if (assetFonts.length > 0) {
        config = (0, withFontsAndroid_1.withFontsAndroid)(config, assetFonts);
    }
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFonts, pkg.name, pkg.version);
