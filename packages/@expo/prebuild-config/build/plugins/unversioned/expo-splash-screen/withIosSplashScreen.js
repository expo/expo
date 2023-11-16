"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSplashScreen = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const debug_1 = __importDefault(require("debug"));
const getIosSplashConfig_1 = require("./getIosSplashConfig");
const withIosSplashAssets_1 = require("./withIosSplashAssets");
const withIosSplashInfoPlist_1 = require("./withIosSplashInfoPlist");
const withIosSplashScreenStoryboard_1 = require("./withIosSplashScreenStoryboard");
const withIosSplashXcodeProject_1 = require("./withIosSplashXcodeProject");
const wtihIosSplashScreenStoryboardImage_1 = require("./wtihIosSplashScreenStoryboardImage");
const debug = (0, debug_1.default)('expo:prebuild-config:expo-splash-screen:ios');
const withIosSplashScreen = (config, splash) => {
    // If the user didn't specify a splash object, infer the splash object from the Expo config.
    if (!splash) {
        splash = (0, getIosSplashConfig_1.getIosSplashConfig)(config);
    }
    else {
        debug(`custom splash config provided`);
    }
    debug(`config:`, splash);
    return (0, config_plugins_1.withPlugins)(config, [
        [withIosSplashInfoPlist_1.withIosSplashInfoPlist, splash],
        [withIosSplashAssets_1.withIosSplashAssets, splash],
        // Add the image settings to the storyboard.
        [wtihIosSplashScreenStoryboardImage_1.withIosSplashScreenImage, splash],
        // Link storyboard to xcode project.
        // TODO: Maybe fold this into the base mod.
        withIosSplashXcodeProject_1.withIosSplashXcodeProject,
        // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
        withIosSplashScreenStoryboard_1.withIosSplashScreenStoryboardBaseMod,
    ]);
};
exports.withIosSplashScreen = withIosSplashScreen;
