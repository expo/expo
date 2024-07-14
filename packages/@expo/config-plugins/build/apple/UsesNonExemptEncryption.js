"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withUsesNonExemptEncryption = exports.setUsesNonExemptEncryption = exports.getUsesNonExemptEncryption = void 0;
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
}) => setUsesNonExemptEncryption(applePlatform)(config, infoPlist), {
  infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
  expoConfigProperty: `${applePlatform}.config.usesNonExemptEncryption`
}, 'withUsesNonExemptEncryption');
exports.withUsesNonExemptEncryption = withUsesNonExemptEncryption;
const getUsesNonExemptEncryption = applePlatform => config => config?.[applePlatform]?.config?.usesNonExemptEncryption ?? null;
exports.getUsesNonExemptEncryption = getUsesNonExemptEncryption;
const setUsesNonExemptEncryption = applePlatform => (config, {
  ITSAppUsesNonExemptEncryption,
  ...infoPlist
}) => {
  const usesNonExemptEncryption = getUsesNonExemptEncryption(applePlatform)(config);

  // Make no changes if the key is left blank
  if (usesNonExemptEncryption === null) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    ITSAppUsesNonExemptEncryption: usesNonExemptEncryption
  };
};
exports.setUsesNonExemptEncryption = setUsesNonExemptEncryption;
//# sourceMappingURL=UsesNonExemptEncryption.js.map