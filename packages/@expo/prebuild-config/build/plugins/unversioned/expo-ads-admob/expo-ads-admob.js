"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidAdMob_1 = require("./withAndroidAdMob");
const withIosAdMob_1 = require("./withIosAdMob");
const createLegacyPlugin_1 = require("../createLegacyPlugin");
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-ads-admob',
    fallback: [withAndroidAdMob_1.withAndroidAdMob, withIosAdMob_1.withIosAdMob],
});
