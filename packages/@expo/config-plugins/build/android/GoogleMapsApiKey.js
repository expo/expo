"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGoogleMapsApiKey = getGoogleMapsApiKey;
exports.setGoogleMapsApiKey = setGoogleMapsApiKey;
exports.withGoogleMapsApiKey = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const META_API_KEY = 'com.google.android.geo.API_KEY';
const LIB_HTTP = 'org.apache.http.legacy';
const withGoogleMapsApiKey = (0, _androidPlugins().createAndroidManifestPlugin)(setGoogleMapsApiKey, 'withGoogleMapsApiKey');
exports.withGoogleMapsApiKey = withGoogleMapsApiKey;
function getGoogleMapsApiKey(config) {
  var _config$android$confi, _config$android, _config$android$confi2, _config$android$confi3;
  return (_config$android$confi = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : (_config$android$confi2 = _config$android.config) === null || _config$android$confi2 === void 0 ? void 0 : (_config$android$confi3 = _config$android$confi2.googleMaps) === null || _config$android$confi3 === void 0 ? void 0 : _config$android$confi3.apiKey) !== null && _config$android$confi !== void 0 ? _config$android$confi : null;
}
function setGoogleMapsApiKey(config, androidManifest) {
  const apiKey = getGoogleMapsApiKey(config);
  const mainApplication = (0, _Manifest().getMainApplicationOrThrow)(androidManifest);
  if (apiKey) {
    // If the item exists, add it back
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, META_API_KEY, apiKey);
    (0, _Manifest().addUsesLibraryItemToMainApplication)(mainApplication, {
      name: LIB_HTTP,
      required: false
    });
  } else {
    // Remove any existing item
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, META_API_KEY);
    (0, _Manifest().removeUsesLibraryItemFromMainApplication)(mainApplication, LIB_HTTP);
  }
  return androidManifest;
}
//# sourceMappingURL=GoogleMapsApiKey.js.map