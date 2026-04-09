"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAndroidSplashScreen_1 = require("./withAndroidSplashScreen");
const withIosSplashScreen_1 = require("./withIosSplashScreen");
const pkg = require('../../package.json');
const withSplashScreen = (config, props) => {
    if (props == null) {
        return config;
    }
    const { android, ios, resizeMode = 'contain', ...rest } = props;
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, {
        ...rest,
        ...android,
        resizeMode: android?.resizeMode ?? resizeMode,
        dark: {
            ...rest?.dark,
            ...android?.dark,
        },
    });
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, {
        ...rest,
        ...ios,
        resizeMode: ios?.resizeMode ?? (resizeMode === 'native' ? 'contain' : resizeMode),
        dark: {
            ...rest?.dark,
            ...ios?.dark,
        },
    });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
