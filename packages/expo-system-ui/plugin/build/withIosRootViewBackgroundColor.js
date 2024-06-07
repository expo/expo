"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootViewBackgroundColor = exports.setRootViewBackgroundColor = exports.withIosRootViewBackgroundColor = void 0;
const config_plugins_1 = require("expo/config-plugins");
// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';
const debug = require('debug')('expo:system-ui:plugin:ios');
const withIosRootViewBackgroundColor = (config) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setRootViewBackgroundColor(config.modRequest.projectRoot, config, config.modResults);
        return config;
    });
    return config;
};
exports.withIosRootViewBackgroundColor = withIosRootViewBackgroundColor;
function setRootViewBackgroundColor(projectRoot, config, infoPlist) {
    const backgroundColor = getRootViewBackgroundColor(config);
    if (!backgroundColor) {
        delete infoPlist[BACKGROUND_COLOR_KEY];
    }
    else {
        const color = (0, config_plugins_1.convertColor)(projectRoot, backgroundColor);
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
