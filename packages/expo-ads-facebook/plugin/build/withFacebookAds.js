"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withFacebookAdsIOS_1 = require("./withFacebookAdsIOS");
const pkg = require('expo-ads-facebook/package.json');
const withFacebookAds = (config, props) => {
    config = withFacebookAdsIOS_1.withUserTrackingPermission(config, props);
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withFacebookAds, pkg.name, pkg.version);
