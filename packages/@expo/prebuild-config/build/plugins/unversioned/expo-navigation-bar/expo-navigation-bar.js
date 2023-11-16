"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidNavigationBar_1 = require("./withAndroidNavigationBar");
const createLegacyPlugin_1 = require("../createLegacyPlugin");
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-navigation-bar',
    fallback: [
        // Android
        withAndroidNavigationBar_1.withNavigationBar,
    ],
});
