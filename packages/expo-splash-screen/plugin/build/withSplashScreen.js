"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen");
const withIosSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen");
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = (config, props) => {
    const resizeMode = props?.resizeMode || 'contain';
    const android = {
        ...props,
        ...props?.android,
        resizeMode,
        dark: {
            ...props?.android?.dark,
            ...props?.dark,
        },
    };
    const ios = {
        ...props,
        ...props?.ios,
        resizeMode: resizeMode === 'native' ? 'contain' : resizeMode,
        dark: {
            ...props?.ios?.dark,
            ...props?.dark,
        },
    };
    // Need to pass null here if we don't receive any props. This means that the plugin has not been used.
    // This only happens on Android. On iOS, if you don't use the plugin, this function won't be called.
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, props ? android : null);
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, ios);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
