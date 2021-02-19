"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAppleAuthEntitlements = exports.withAppleAuthIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
exports.withAppleAuthIOS = config => {
    return config_plugins_1.withEntitlementsPlist(config, config => {
        config.modResults = setAppleAuthEntitlements(config, config.modResults);
        return config;
    });
};
function setAppleAuthEntitlements(config, entitlements) {
    var _a;
    if ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.usesAppleSignIn) {
        entitlements['com.apple.developer.applesignin'] = ['Default'];
    }
    return entitlements;
}
exports.setAppleAuthEntitlements = setAppleAuthEntitlements;
