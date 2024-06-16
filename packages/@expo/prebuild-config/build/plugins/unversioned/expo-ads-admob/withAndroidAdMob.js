"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGoogleMobileAdsAppId = getGoogleMobileAdsAppId;
exports.getGoogleMobileAdsAutoInit = getGoogleMobileAdsAutoInit;
exports.setAdMobConfig = setAdMobConfig;
exports.withAndroidAdMob = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication
} = _configPlugins().AndroidConfig.Manifest;
const META_APPLICATION_ID = 'com.google.android.gms.ads.APPLICATION_ID';
const META_DELAY_APP_MEASUREMENT_INIT = 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT';
const withAndroidAdMob = config => {
  return (0, _configPlugins().withAndroidManifest)(config, config => {
    config.modResults = setAdMobConfig(config, config.modResults);
    return config;
  });
};
exports.withAndroidAdMob = withAndroidAdMob;
function getGoogleMobileAdsAppId(config) {
  return config.android?.config?.googleMobileAdsAppId ?? null;
}
function getGoogleMobileAdsAutoInit(config) {
  return config.android?.config?.googleMobileAdsAutoInit ?? false;
}
function setAdMobConfig(config, androidManifest) {
  const appId = getGoogleMobileAdsAppId(config);
  const autoInit = getGoogleMobileAdsAutoInit(config);
  const mainApplication = getMainApplicationOrThrow(androidManifest);
  if (appId) {
    addMetaDataItemToMainApplication(mainApplication, META_APPLICATION_ID, appId);
    addMetaDataItemToMainApplication(mainApplication, META_DELAY_APP_MEASUREMENT_INIT, String(!autoInit));
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_APPLICATION_ID);
    removeMetaDataItemFromMainApplication(mainApplication, META_DELAY_APP_MEASUREMENT_INIT);
  }
  return androidManifest;
}
//# sourceMappingURL=withAndroidAdMob.js.map