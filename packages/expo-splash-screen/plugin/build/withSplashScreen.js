"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withSplashScreenAndroid_1 = require("./withSplashScreenAndroid");
const withSplashScreenIOS_1 = require("./withSplashScreenIOS");
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = config => {
    config = withSplashScreenAndroid_1.withSplashScreenAndroid(config);
    config = withSplashScreenIOS_1.withSplashScreenIOS(config);
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
