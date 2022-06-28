"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withSKAdNetworkIdentifiers = void 0;

function _withIosFacebook() {
  const data = require("./withIosFacebook");

  _withIosFacebook = function () {
    return data;
  };

  return data;
}

/**
 * Plugin to add [`SKAdNetworkIdentifier`](https://developer.apple.com/documentation/storekit/skadnetwork/configuring_the_participating_apps)s to the Info.plist safely.
 *
 *
 * @param config
 * @param props.identifiers array of lowercase string ids to push to the `SKAdNetworkItems` array in the `Info.plist`.
 */
const withSKAdNetworkIdentifiers = (config, identifiers) => {
  // Only add the iOS ad network values if facebookAppId is defined.
  const facebookAppId = (0, _withIosFacebook().getFacebookAppId)(config);

  if (!facebookAppId) {
    return config;
  }

  if (!config.ios) {
    config.ios = {};
  }

  if (!config.ios.infoPlist) {
    config.ios.infoPlist = {};
  }

  if (!Array.isArray(config.ios.infoPlist.SKAdNetworkItems)) {
    config.ios.infoPlist.SKAdNetworkItems = [];
  } // Get ids


  let existingIds = config.ios.infoPlist.SKAdNetworkItems.map(item => {
    var _item$SKAdNetworkIden;

    return (_item$SKAdNetworkIden = item === null || item === void 0 ? void 0 : item.SKAdNetworkIdentifier) !== null && _item$SKAdNetworkIden !== void 0 ? _item$SKAdNetworkIden : null;
  }).filter(Boolean); // remove duplicates

  existingIds = [...new Set(existingIds)];

  for (const id of identifiers) {
    // Must be lowercase
    const lower = id.toLowerCase();

    if (!existingIds.includes(lower)) {
      config.ios.infoPlist.SKAdNetworkItems.push({
        SKAdNetworkIdentifier: lower
      });
    }
  }

  return config;
};

exports.withSKAdNetworkIdentifiers = withSKAdNetworkIdentifiers;
//# sourceMappingURL=withSKAdNetworkIdentifiers.js.map