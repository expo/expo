"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const withFontsAndroid_1 = require("./withFontsAndroid");
const withFontsIos_1 = require("./withFontsIos");
const pkg = require('expo-font/package.json');
const withFonts = (config, props) => {
    const fonts = props.fonts
        ?.map((p) => {
        const resolvedPath = path_1.default.resolve(config._internal?.projectRoot, p);
        if (fs_1.default.statSync(resolvedPath).isDirectory()) {
            return fs_1.default.readdirSync(resolvedPath).map((file) => path_1.default.join(resolvedPath, file));
        }
        return [resolvedPath];
    })
        .flat() ?? [];
    if (fonts.length === 0) {
        return config;
    }
    config = (0, withFontsIos_1.withFontsIos)(config, fonts);
    config = (0, withFontsAndroid_1.withFontsAndroid)(config, fonts);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFonts, pkg.name, pkg.version);
