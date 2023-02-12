"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBranchApiKey = exports.getBranchApiKey = exports.withBranchAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const META_BRANCH_KEY = 'io.branch.sdk.BranchKey';
const withBranchAndroid = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setBranchApiKey(config, config.modResults);
        return config;
    });
};
exports.withBranchAndroid = withBranchAndroid;
function getBranchApiKey(config) {
    return config.android?.config?.branch?.apiKey ?? null;
}
exports.getBranchApiKey = getBranchApiKey;
function setBranchApiKey(config, androidManifest) {
    const apiKey = getBranchApiKey(config);
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    if (apiKey) {
        // If the item exists, add it back
        addMetaDataItemToMainApplication(mainApplication, META_BRANCH_KEY, apiKey);
    }
    else {
        // Remove any existing item
        removeMetaDataItemFromMainApplication(mainApplication, META_BRANCH_KEY);
    }
    return androidManifest;
}
exports.setBranchApiKey = setBranchApiKey;
