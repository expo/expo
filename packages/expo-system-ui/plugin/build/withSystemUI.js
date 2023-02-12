"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAndroidRootViewBackgroundColor_1 = require("./withAndroidRootViewBackgroundColor");
const withAndroidUserInterfaceStyle_1 = require("./withAndroidUserInterfaceStyle");
const withIosRootViewBackgroundColor_1 = require("./withIosRootViewBackgroundColor");
const withIosUserInterfaceStyle_1 = require("./withIosUserInterfaceStyle");
const pkg = require('expo-system-ui/package.json');
const withSystemUI = (config) => {
    return (0, config_plugins_1.withPlugins)(config, [
        withAndroidRootViewBackgroundColor_1.withAndroidRootViewBackgroundColor,
        withIosRootViewBackgroundColor_1.withIosRootViewBackgroundColor,
        withAndroidUserInterfaceStyle_1.withAndroidUserInterfaceStyle,
        withIosUserInterfaceStyle_1.withIosUserInterfaceStyle,
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSystemUI, pkg.name, pkg.version);
