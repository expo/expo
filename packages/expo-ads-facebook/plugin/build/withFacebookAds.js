"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withFacebookAdsIOS_1 = require("./withFacebookAdsIOS");
const withSKAdNetworkIdentifiers_1 = require("./withSKAdNetworkIdentifiers");
const pkg = require('expo-ads-facebook/package.json');
const withFacebookAds = (config, props) => {
    config = (0, withFacebookAdsIOS_1.withUserTrackingPermission)(config, props);
    // https://developers.facebook.com/docs/SKAdNetwork
    config = (0, withSKAdNetworkIdentifiers_1.withSKAdNetworkIdentifiers)(config, ['v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork']);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFacebookAds, pkg.name, pkg.version);
