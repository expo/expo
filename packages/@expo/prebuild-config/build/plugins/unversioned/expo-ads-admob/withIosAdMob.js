"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGoogleMobileAdsAppId = getGoogleMobileAdsAppId;
exports.setGoogleMobileAdsAppId = setGoogleMobileAdsAppId;
exports.withIosAdMob = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withIosAdMob = config => {
  return (0, _configPlugins().withInfoPlist)(config, config => {
    config.modResults = setAdMobConfig(config, config.modResults);
    return config;
  });
};

// NOTE(brentvatne): if the developer has installed the google ads sdk and does
// not provide an app id their app will crash. Standalone apps get around this by
// providing some default value, we will instead here assume that the user can
// do the right thing if they have installed the package. This is a slight discrepancy
// that arises in ejecting because it's possible for the package to be installed and
// not crashing in the managed workflow, then you eject and the app crashes because
// you don't have an id to fall back to.
exports.withIosAdMob = withIosAdMob;
function getGoogleMobileAdsAppId(config) {
  var _config$ios$config$go, _config$ios, _config$ios$config;
  return (_config$ios$config$go = (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : (_config$ios$config = _config$ios.config) === null || _config$ios$config === void 0 ? void 0 : _config$ios$config.googleMobileAdsAppId) !== null && _config$ios$config$go !== void 0 ? _config$ios$config$go : null;
}
function setGoogleMobileAdsAppId(config, {
  GADApplicationIdentifier,
  ...infoPlist
}) {
  const appId = getGoogleMobileAdsAppId(config);
  if (appId === null) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    GADApplicationIdentifier: appId
  };
}
function setAdMobConfig(config, infoPlist) {
  infoPlist = setGoogleMobileAdsAppId(config, infoPlist);
  return infoPlist;
}
//# sourceMappingURL=withIosAdMob.js.map