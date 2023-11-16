"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidSplashScreen_1 = require("./withAndroidSplashScreen");
const withIosSplashScreen_1 = require("./withIosSplashScreen");
const createLegacyPlugin_1 = require("../createLegacyPlugin");
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-splash-screen',
    fallback: [withAndroidSplashScreen_1.withAndroidSplashScreen, withIosSplashScreen_1.withIosSplashScreen],
});
