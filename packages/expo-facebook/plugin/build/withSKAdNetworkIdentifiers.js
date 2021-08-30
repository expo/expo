"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSKAdNetworkIdentifiers = void 0;
/**
 * Plugin to add [`SKAdNetworkIdentifier`](https://developer.apple.com/documentation/storekit/skadnetwork/configuring_the_participating_apps)s to the Info.plist safely.
 *
 *
 * @param config
 * @param props.identifiers array of lowercase string ids to push to the `SKAdNetworkItems` array in the `Info.plist`.
 */
const withSKAdNetworkIdentifiers = (config, identifiers) => {
    if (!config.ios) {
        config.ios = {};
    }
    if (!config.ios.infoPlist) {
        config.ios.infoPlist = {};
    }
    if (!Array.isArray(config.ios.infoPlist.SKAdNetworkItems)) {
        config.ios.infoPlist.SKAdNetworkItems = [];
    }
    // Get ids
    let existingIds = config.ios.infoPlist.SKAdNetworkItems.map((item) => { var _a; return (_a = item === null || item === void 0 ? void 0 : item.SKAdNetworkIdentifier) !== null && _a !== void 0 ? _a : null; }).filter(Boolean);
    // remove duplicates
    existingIds = [...new Set(existingIds)];
    for (const id of identifiers) {
        // Must be lowercase
        const lower = id.toLowerCase();
        if (!existingIds.includes(lower)) {
            config.ios.infoPlist.SKAdNetworkItems.push({
                SKAdNetworkIdentifier: lower,
            });
        }
    }
    return config;
};
exports.withSKAdNetworkIdentifiers = withSKAdNetworkIdentifiers;
