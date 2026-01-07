"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAppGroupEntitlements = (config, { groupIdentifier }) => (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
    config.ios = {
        ...config.ios,
        entitlements: _addApplicationGroupsEntitlement(config.ios?.entitlements ?? {}, groupIdentifier),
    };
    return config;
});
exports.default = withAppGroupEntitlements;
function _addApplicationGroupsEntitlement(entitlements, groupIdentifier) {
    if (!groupIdentifier) {
        return entitlements;
    }
    const existingApplicationGroups = entitlements['com.apple.security.application-groups'] ?? [];
    if (!existingApplicationGroups.includes(groupIdentifier)) {
        entitlements['com.apple.security.application-groups'] = [
            groupIdentifier,
            ...existingApplicationGroups,
        ];
    }
    return entitlements;
}
