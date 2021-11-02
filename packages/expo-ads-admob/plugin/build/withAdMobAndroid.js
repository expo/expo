"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdMobConfig = exports.getGoogleMobileAdsAutoInit = exports.getGoogleMobileAdsAppId = exports.withAdMobAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const META_APPLICATION_ID = 'com.google.android.gms.ads.APPLICATION_ID';
const META_DELAY_APP_MEASUREMENT_INIT = 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT';
const withAdMobAndroid = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setAdMobConfig(config, config.modResults);
        return config;
    });
};
exports.withAdMobAndroid = withAdMobAndroid;
function getGoogleMobileAdsAppId(config) {
    var _a, _b, _c;
    return (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.googleMobileAdsAppId) !== null && _c !== void 0 ? _c : null;
}
exports.getGoogleMobileAdsAppId = getGoogleMobileAdsAppId;
function getGoogleMobileAdsAutoInit(config) {
    var _a, _b, _c;
    return (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.googleMobileAdsAutoInit) !== null && _c !== void 0 ? _c : false;
}
exports.getGoogleMobileAdsAutoInit = getGoogleMobileAdsAutoInit;
function setAdMobConfig(config, androidManifest) {
    const appId = getGoogleMobileAdsAppId(config);
    const autoInit = getGoogleMobileAdsAutoInit(config);
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    if (appId) {
        addMetaDataItemToMainApplication(mainApplication, META_APPLICATION_ID, appId);
        addMetaDataItemToMainApplication(mainApplication, META_DELAY_APP_MEASUREMENT_INIT, String(!autoInit));
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, META_APPLICATION_ID);
        removeMetaDataItemFromMainApplication(mainApplication, META_DELAY_APP_MEASUREMENT_INIT);
    }
    return androidManifest;
}
exports.setAdMobConfig = setAdMobConfig;
