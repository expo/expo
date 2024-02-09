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
const withUsesNonExemptEncryption = exports.withUsesNonExemptEncryption = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setUsesNonExemptEncryption, {
  infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
  expoConfigProperty: 'ios.config.usesNonExemptEncryption'
}, 'withUsesNonExemptEncryption');
function getUsesNonExemptEncryption(config) {
  return config?.ios?.config?.usesNonExemptEncryption ?? null;
}
function setUsesNonExemptEncryption(config, {
  ITSAppUsesNonExemptEncryption,
  ...infoPlist
}) {
  const usesNonExemptEncryption = getUsesNonExemptEncryption(config);

  // Make no changes if the key is left blank
  if (usesNonExemptEncryption === null) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    ITSAppUsesNonExemptEncryption: usesNonExemptEncryption
  };
}
//# sourceMappingURL=UsesNonExemptEncryption.js.map