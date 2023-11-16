"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidRootViewBackgroundColor_1 = require("./withAndroidRootViewBackgroundColor");
const withAndroidUserInterfaceStyle_1 = require("./withAndroidUserInterfaceStyle");
const withIosRootViewBackgroundColor_1 = require("./withIosRootViewBackgroundColor");
const withIosUserInterfaceStyle_1 = require("./withIosUserInterfaceStyle");
const createLegacyPlugin_1 = require("../createLegacyPlugin");
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-system-ui',
    fallback: [
        withAndroidRootViewBackgroundColor_1.withAndroidRootViewBackgroundColor,
        withIosRootViewBackgroundColor_1.withIosRootViewBackgroundColor,
        withAndroidUserInterfaceStyle_1.withAndroidUserInterfaceStyle,
        withIosUserInterfaceStyle_1.withIosUserInterfaceStyle,
    ],
});
