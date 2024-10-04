"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen");
const withIosSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen");
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = (config) => {
    // For simplicity, we'll version the unversioned code in expo-splash-screen.
    // This adds more JS to the package overall, but the trade-off is less copying between expo-cli/expo.
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config);
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
