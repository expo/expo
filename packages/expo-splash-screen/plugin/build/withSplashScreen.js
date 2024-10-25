"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen");
const withIosSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen");
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = (config, props) => {
    const android = {
        ...config.splash,
        ...config.android?.splash,
        ...props,
        ...props?.android,
    };
    const ios = {
        ...config.splash,
        ...config.ios?.splash,
        ...props,
        ...props?.ios,
    };
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, android);
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, ios);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
