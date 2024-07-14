"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUsesNonExemptEncryption = getUsesNonExemptEncryption;
exports.setUsesNonExemptEncryption = setUsesNonExemptEncryption;
exports.withUsesNonExemptEncryption = void 0;
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
const withUsesNonExemptEncryption = applePlatform => (0, _applePlugins().createInfoPlistPluginWithPropertyGuard)(applePlatform)((config, {
  ITSAppUsesNonExemptEncryption,
  ...infoPlist
}) => setUsesNonExemptEncryption(applePlatform, config, infoPlist), {
  infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
  expoConfigProperty: `${applePlatform}.config.usesNonExemptEncryption`
}, 'withUsesNonExemptEncryption');
exports.withUsesNonExemptEncryption = withUsesNonExemptEncryption;
function getUsesNonExemptEncryption(applePlatform, config) {
  return config?.[applePlatform]?.config?.usesNonExemptEncryption ?? null;
}
function setUsesNonExemptEncryption(applePlatform, config, {
  ITSAppUsesNonExemptEncryption,
  ...infoPlist
}) {
  const usesNonExemptEncryption = getUsesNonExemptEncryption(applePlatform, config);

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