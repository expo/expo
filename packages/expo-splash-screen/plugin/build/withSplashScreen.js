"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen");
const withIosSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen");
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = (config, props) => {
    const imageWidth = props ? props.imageWidth : 200;
    const { dark, ...rest } = props;
    const android = {
        ...rest,
        ...rest?.android,
        resizeMode: 'contain',
        dark: {
            ...rest?.android?.dark,
            ...dark,
            resizeMode: 'contain',
        },
        imageWidth,
    };
    const ios = {
        ...rest,
        ...rest?.ios,
        resizeMode: 'contain',
        dark: {
            ...rest?.ios?.dark,
            ...dark,
        },
        imageWidth,
    };
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, android);
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, ios);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
