"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUsesNonExemptEncryption = getUsesNonExemptEncryption;
exports.setUsesNonExemptEncryption = setUsesNonExemptEncryption;
exports.withUsesNonExemptEncryption = void 0;

function _iosPlugins() {
  const data = require("../plugins/ios-plugins");

  _iosPlugins = function () {
    return data;
  };

  return data;
}

const withUsesNonExemptEncryption = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setUsesNonExemptEncryption, {
  infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
  expoConfigProperty: 'ios.config.usesNonExemptEncryption'
}, 'withUsesNonExemptEncryption');
exports.withUsesNonExemptEncryption = withUsesNonExemptEncryption;

function getUsesNonExemptEncryption(config) {
  var _config$ios$config$us, _config$ios, _config$ios$config;

  return (_config$ios$config$us = config === null || config === void 0 ? void 0 : (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : (_config$ios$config = _config$ios.config) === null || _config$ios$config === void 0 ? void 0 : _config$ios$config.usesNonExemptEncryption) !== null && _config$ios$config$us !== void 0 ? _config$ios$config$us : null;
}

function setUsesNonExemptEncryption(config, {
  ITSAppUsesNonExemptEncryption,
  ...infoPlist
}) {
  const usesNonExemptEncryption = getUsesNonExemptEncryption(config); // Make no changes if the key is left blank

  if (usesNonExemptEncryption === null) {
    return infoPlist;
  }

  return { ...infoPlist,
    ITSAppUsesNonExemptEncryption: usesNonExemptEncryption
  };
}
//# sourceMappingURL=UsesNonExemptEncryption.js.map