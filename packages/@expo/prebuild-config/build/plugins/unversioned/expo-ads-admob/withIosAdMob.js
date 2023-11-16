"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGoogleMobileAdsAppId = exports.getGoogleMobileAdsAppId = exports.withIosAdMob = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withIosAdMob = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setAdMobConfig(config, config.modResults);
        return config;
    });
};
exports.withIosAdMob = withIosAdMob;
// NOTE(brentvatne): if the developer has installed the google ads sdk and does
// not provide an app id their app will crash. Standalone apps get around this by
// providing some default value, we will instead here assume that the user can
// do the right thing if they have installed the package. This is a slight discrepancy
// that arises in ejecting because it's possible for the package to be installed and
// not crashing in the managed workflow, then you eject and the app crashes because
// you don't have an id to fall back to.
function getGoogleMobileAdsAppId(config) {
    return config.ios?.config?.googleMobileAdsAppId ?? null;
}
exports.getGoogleMobileAdsAppId = getGoogleMobileAdsAppId;
function setGoogleMobileAdsAppId(config, { GADApplicationIdentifier, ...infoPlist }) {
    const appId = getGoogleMobileAdsAppId(config);
    if (appId === null) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        GADApplicationIdentifier: appId,
    };
}
exports.setGoogleMobileAdsAppId = setGoogleMobileAdsAppId;
function setAdMobConfig(config, infoPlist) {
    infoPlist = setGoogleMobileAdsAppId(config, infoPlist);
    return infoPlist;
}
