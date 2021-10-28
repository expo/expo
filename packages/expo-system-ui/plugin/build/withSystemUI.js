"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withAndroidRootViewBackgroundColor_1 = require("./withAndroidRootViewBackgroundColor");
const withIosRootViewBackgroundColor_1 = require("./withIosRootViewBackgroundColor");
const pkg = require('expo-system-ui/package.json');
const withSystemUI = (config) => {
    return (0, withAndroidRootViewBackgroundColor_1.withAndroidRootViewBackgroundColor)((0, withIosRootViewBackgroundColor_1.withIosRootViewBackgroundColor)(config));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSystemUI, pkg.name, pkg.version);
