"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdMobConfig = exports.getGoogleMobileAdsAutoInit = exports.getGoogleMobileAdsAppId = exports.withAndroidAdMob = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const META_APPLICATION_ID = 'com.google.android.gms.ads.APPLICATION_ID';
const META_DELAY_APP_MEASUREMENT_INIT = 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT';
const withAndroidAdMob = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setAdMobConfig(config, config.modResults);
        return config;
    });
};
exports.withAndroidAdMob = withAndroidAdMob;
function getGoogleMobileAdsAppId(config) {
    return config.android?.config?.googleMobileAdsAppId ?? null;
}
exports.getGoogleMobileAdsAppId = getGoogleMobileAdsAppId;
function getGoogleMobileAdsAutoInit(config) {
    return config.android?.config?.googleMobileAdsAutoInit ?? false;
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
