"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAndroidSplashScreen_1 = require("./withAndroidSplashScreen");
const withIosSplashScreen_1 = require("./withIosSplashScreen");
const pkg = require('../../package.json');
const withSplashScreen = (config, props) => {
    if (props != null) {
        config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, props);
        config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, props);
    }
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
