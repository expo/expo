"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSplashScreen = exports.withAndroidSplashScreen = void 0;
const config_plugins_1 = require("expo/config-plugins");
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const getIosSplashConfig_1 = require("./getIosSplashConfig");
const withAndroidSplashDrawables_1 = require("./withAndroidSplashDrawables");
const withAndroidSplashImages_1 = require("./withAndroidSplashImages");
const withAndroidSplashMainActivity_1 = require("./withAndroidSplashMainActivity");
const withAndroidSplashStrings_1 = require("./withAndroidSplashStrings");
const withAndroidSplashStyles_1 = require("./withAndroidSplashStyles");
const withIosSplashAssets_1 = require("./withIosSplashAssets");
const withIosSplashColors_1 = require("./withIosSplashColors");
const withIosSplashInfoPlist_1 = require("./withIosSplashInfoPlist");
const withIosSplashScreenStoryboard_1 = require("./withIosSplashScreenStoryboard");
const withIosSplashScreenStoryboardImage_1 = require("./withIosSplashScreenStoryboardImage");
const withIosSplashXcodeProject_1 = require("./withIosSplashXcodeProject");
const pkg = require('../../package.json');
const withAndroidSplashScreen = (config, splash) => (0, config_plugins_1.withPlugins)(config, [
    withAndroidSplashMainActivity_1.withAndroidSplashMainActivity,
    [withAndroidSplashImages_1.withAndroidSplashImages, splash],
    [withAndroidSplashDrawables_1.withAndroidSplashDrawables, splash],
    [withAndroidSplashStyles_1.withAndroidSplashStyles, splash],
    [withAndroidSplashStrings_1.withAndroidSplashStrings, splash],
]);
exports.withAndroidSplashScreen = withAndroidSplashScreen;
const withIosSplashScreen = (config, splash) => (0, config_plugins_1.withPlugins)(config, [
    [withIosSplashInfoPlist_1.withIosSplashInfoPlist, splash],
    [withIosSplashAssets_1.withIosSplashAssets, splash],
    [withIosSplashColors_1.withIosSplashColors, splash],
    [withIosSplashScreenStoryboardImage_1.withIosSplashScreenImage, splash],
    withIosSplashXcodeProject_1.withIosSplashXcodeProject,
    // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
    withIosSplashScreenStoryboard_1.withIosSplashScreenStoryboardBaseMod,
]);
exports.withIosSplashScreen = withIosSplashScreen;
const withSplashScreen = (config, props) => {
    if (props == null) {
        return config;
    }
    const configs = {
        android: (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(props),
        ios: (0, getIosSplashConfig_1.getIosSplashConfig)(props),
    };
    // Elevate configs to a static value on extra so Expo Go can read it.
    config.extra ??= {};
    config.extra[pkg.name] = configs;
    config = (0, exports.withAndroidSplashScreen)(config, configs.android);
    config = (0, exports.withIosSplashScreen)(config, configs.ios);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
