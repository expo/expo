"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGoogleMapsApiKey = exports.getGoogleMapsApiKey = exports.withGoogleMapsApiKey = void 0;
const Manifest_1 = require("./Manifest");
const android_plugins_1 = require("../plugins/android-plugins");
const META_API_KEY = 'com.google.android.geo.API_KEY';
const LIB_HTTP = 'org.apache.http.legacy';
exports.withGoogleMapsApiKey = (0, android_plugins_1.createAndroidManifestPlugin)(setGoogleMapsApiKey, 'withGoogleMapsApiKey');
function getGoogleMapsApiKey(config) {
    return config.android?.config?.googleMaps?.apiKey ?? null;
}
exports.getGoogleMapsApiKey = getGoogleMapsApiKey;
function setGoogleMapsApiKey(config, androidManifest) {
    const apiKey = getGoogleMapsApiKey(config);
    const mainApplication = (0, Manifest_1.getMainApplicationOrThrow)(androidManifest);
    if (apiKey) {
        // If the item exists, add it back
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, META_API_KEY, apiKey);
        (0, Manifest_1.addUsesLibraryItemToMainApplication)(mainApplication, {
            name: LIB_HTTP,
            required: false,
        });
    }
    else {
        // Remove any existing item
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, META_API_KEY);
        (0, Manifest_1.removeUsesLibraryItemFromMainApplication)(mainApplication, LIB_HTTP);
    }
    return androidManifest;
}
exports.setGoogleMapsApiKey = setGoogleMapsApiKey;
