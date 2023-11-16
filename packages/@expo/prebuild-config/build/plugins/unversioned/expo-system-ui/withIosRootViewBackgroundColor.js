"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootViewBackgroundColor = exports.setRootViewBackgroundColor = exports.warnSystemUIMissing = exports.shouldUseLegacyBehavior = exports.withIosRootViewBackgroundColor = void 0;
const config_plugins_1 = require("@expo/config-plugins");
// @ts-ignore: uses flow
const normalize_color_1 = __importDefault(require("@react-native/normalize-color"));
const semver_1 = __importDefault(require("semver"));
// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';
const debug = require('debug')('expo:system-ui:plugin:ios');
const withIosRootViewBackgroundColor = (config) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (shouldUseLegacyBehavior(config)) {
            config.modResults = setRootViewBackgroundColor(config, config.modResults);
        }
        else {
            warnSystemUIMissing(config);
        }
        return config;
    });
    return config;
};
exports.withIosRootViewBackgroundColor = withIosRootViewBackgroundColor;
/** The template was changed in SDK 43 to move the background color logic to the `expo-system-ui` module */
function shouldUseLegacyBehavior(config) {
    try {
        return !!(config.sdkVersion && semver_1.default.lt(config.sdkVersion, '44.0.0'));
    }
    catch { }
    return false;
}
exports.shouldUseLegacyBehavior = shouldUseLegacyBehavior;
function warnSystemUIMissing(config) {
    const backgroundColor = getRootViewBackgroundColor(config);
    if (backgroundColor) {
        // Background color needs to be set programmatically
        config_plugins_1.WarningAggregator.addWarningIOS('ios.backgroundColor', 'Install expo-system-ui to enable this feature', 'https://docs.expo.dev/build-reference/migrating/#expo-config--backgroundcolor--depends-on');
    }
}
exports.warnSystemUIMissing = warnSystemUIMissing;
function setRootViewBackgroundColor(config, infoPlist) {
    const backgroundColor = getRootViewBackgroundColor(config);
    if (!backgroundColor) {
        delete infoPlist[BACKGROUND_COLOR_KEY];
    }
    else {
        let color = (0, normalize_color_1.default)(backgroundColor);
        if (!color) {
            throw new Error('Invalid background color on iOS');
        }
        color = ((color << 24) | (color >>> 8)) >>> 0;
        infoPlist[BACKGROUND_COLOR_KEY] = color;
        debug(`Convert color: ${backgroundColor} -> ${color}`);
    }
    return infoPlist;
}
exports.setRootViewBackgroundColor = setRootViewBackgroundColor;
function getRootViewBackgroundColor(config) {
    return config.ios?.backgroundColor || config.backgroundColor || null;
}
exports.getRootViewBackgroundColor = getRootViewBackgroundColor;
