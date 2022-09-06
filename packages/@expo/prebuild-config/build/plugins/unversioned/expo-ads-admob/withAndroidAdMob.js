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
  var _config$android$confi, _config$android, _config$android$confi2;

  return (_config$android$confi = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : (_config$android$confi2 = _config$android.config) === null || _config$android$confi2 === void 0 ? void 0 : _config$android$confi2.googleMobileAdsAppId) !== null && _config$android$confi !== void 0 ? _config$android$confi : null;
}

function getGoogleMobileAdsAutoInit(config) {
  var _config$android$confi3, _config$android2, _config$android2$conf;

  return (_config$android$confi3 = (_config$android2 = config.android) === null || _config$android2 === void 0 ? void 0 : (_config$android2$conf = _config$android2.config) === null || _config$android2$conf === void 0 ? void 0 : _config$android2$conf.googleMobileAdsAutoInit) !== null && _config$android$confi3 !== void 0 ? _config$android$confi3 : false;
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