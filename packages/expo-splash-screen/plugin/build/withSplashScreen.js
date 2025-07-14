"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen");
const withIosSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen");
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = (config, props) => {
    let android = null;
    let ios = null;
    const resizeMode = props?.resizeMode || 'contain';
    const { ios: iosProps, android: androidProps, ...otherProps } = props ?? {};
    const usesLegacySplashConfigIOS = !props || (androidProps && !iosProps && Object.keys(otherProps).length === 0);
    const usesLegacySplashConfigAndroid = !props || (iosProps && !androidProps && Object.keys(otherProps).length === 0);
    android = usesLegacySplashConfigAndroid
        ? null
        : {
            ...otherProps,
            ...androidProps,
            resizeMode: androidProps?.resizeMode || resizeMode,
            dark: {
                ...otherProps?.dark,
                ...androidProps?.dark,
            },
        };
    ios = usesLegacySplashConfigIOS
        ? null
        : {
            ...otherProps,
            ...iosProps,
            resizeMode: iosProps?.resizeMode || (resizeMode === 'native' ? 'contain' : resizeMode),
            dark: {
                ...otherProps?.dark,
                ...iosProps?.dark,
            },
        };
    // Passing null here will result in the legacy splash config being used.
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, android);
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, ios);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
