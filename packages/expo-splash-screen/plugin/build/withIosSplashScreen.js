"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSplashScreen = void 0;
const debug_1 = __importDefault(require("debug"));
const config_plugins_1 = require("expo/config-plugins");
const getIosSplashConfig_1 = require("./getIosSplashConfig");
const withIosSplashAssets_1 = require("./withIosSplashAssets");
const withIosSplashColors_1 = require("./withIosSplashColors");
const withIosSplashInfoPlist_1 = require("./withIosSplashInfoPlist");
const withIosSplashScreenStoryboard_1 = require("./withIosSplashScreenStoryboard");
const withIosSplashScreenStoryboardImage_1 = require("./withIosSplashScreenStoryboardImage");
const withIosSplashXcodeProject_1 = require("./withIosSplashXcodeProject");
const debug = (0, debug_1.default)('expo:expo-splash-screen:ios');
const withIosSplashScreen = (config, props) => {
    const splash = (0, getIosSplashConfig_1.getIosSplashConfig)(props);
    debug(`config:`, props);
    return (0, config_plugins_1.withPlugins)(config, [
        [withIosSplashInfoPlist_1.withIosSplashInfoPlist, splash],
        [withIosSplashAssets_1.withIosSplashAssets, splash],
        [withIosSplashColors_1.withIosSplashColors, splash],
        // Add the image settings to the storyboard.
        [withIosSplashScreenStoryboardImage_1.withIosSplashScreenImage, splash],
        // Link storyboard to xcode project.
        // TODO: Maybe fold this into the base mod.
        withIosSplashXcodeProject_1.withIosSplashXcodeProject,
        // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
        withIosSplashScreenStoryboard_1.withIosSplashScreenStoryboardBaseMod,
    ]);
};
exports.withIosSplashScreen = withIosSplashScreen;
