"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosRootViewBackgroundColor = void 0;
exports.setRootViewBackgroundColor = setRootViewBackgroundColor;
exports.getRootViewBackgroundColor = getRootViewBackgroundColor;
// @ts-ignore: uses flow
const normalize_colors_1 = __importDefault(require("@react-native/normalize-colors"));
const config_plugins_1 = require("expo/config-plugins");
// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';
const debug = require('debug')('expo:system-ui:plugin:ios');
const withIosRootViewBackgroundColor = (config) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setRootViewBackgroundColor(config, config.modResults);
        return config;
    });
    return config;
};
exports.withIosRootViewBackgroundColor = withIosRootViewBackgroundColor;
function setRootViewBackgroundColor(config, infoPlist) {
    const backgroundColor = getRootViewBackgroundColor(config);
    if (!backgroundColor) {
        delete infoPlist[BACKGROUND_COLOR_KEY];
    }
    else {
        let color = (0, normalize_colors_1.default)(backgroundColor);
        if (!color) {
            throw new Error('Invalid background color on iOS');
        }
        color = ((color << 24) | (color >>> 8)) >>> 0;
        infoPlist[BACKGROUND_COLOR_KEY] = color;
        debug(`Convert color: ${backgroundColor} -> ${color}`);
    }
    return infoPlist;
}
function getRootViewBackgroundColor(config) {
    return config.ios?.backgroundColor || config.backgroundColor || null;
}
