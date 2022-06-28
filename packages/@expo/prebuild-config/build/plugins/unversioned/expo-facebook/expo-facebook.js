"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _createLegacyPlugin() {
  const data = require("../createLegacyPlugin");

  _createLegacyPlugin = function () {
    return data;
  };

  return data;
}

function _withAndroidFacebook() {
  const data = require("./withAndroidFacebook");

  _withAndroidFacebook = function () {
    return data;
  };

  return data;
}

function _withIosFacebook() {
  const data = require("./withIosFacebook");

  _withIosFacebook = function () {
    return data;
  };

  return data;
}

function _withSKAdNetworkIdentifiers() {
  const data = require("./withSKAdNetworkIdentifiers");

  _withSKAdNetworkIdentifiers = function () {
    return data;
  };

  return data;
}

var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-facebook',
  fallback: [// Android
  _withAndroidFacebook().withFacebookAppIdString, _withAndroidFacebook().withFacebookManifest, // iOS
  _withIosFacebook().withIosFacebook, [_withSKAdNetworkIdentifiers().withSKAdNetworkIdentifiers, // https://developers.facebook.com/docs/SKAdNetwork
  ['v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork']]]
});

exports.default = _default;
//# sourceMappingURL=expo-facebook.js.map