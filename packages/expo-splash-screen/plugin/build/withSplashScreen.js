"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen");
const withIosSplashScreen_1 = require("@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen");
const debug_1 = __importDefault(require("debug"));
const config_plugins_1 = require("expo/config-plugins");
const debug = (0, debug_1.default)('expo:prebuild-config:expo-splash-screen');
const pkg = require('expo-splash-screen/package.json');
const withSplashScreen = (config, splash = undefined) => {
    // For simplicity, we'll version the unversioned code in expo-splash-screen.
    // This adds more JS to the package overall, but the trade-off is less copying between expo-cli/expo.
    debug(`Custom splash info provided: ${JSON.stringify(splash, null, 2)}`);
    config = (0, withAndroidSplashScreen_1.withAndroidSplashScreen)(config, splash?.android || undefined);
    config = (0, withIosSplashScreen_1.withIosSplashScreen)(config, splash?.ios || undefined);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSplashScreen, pkg.name, pkg.version);
