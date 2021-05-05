"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAppleAuthEntitlements = exports.withAppleAuthIOS = void 0;
exports.withAppleAuthIOS = config => {
    if (!config.ios)
        config.ios = {};
    // Statically setting the entitlements outside of the entitlements mod so tools like eas-cli
    // can determine which capabilities to enable before building the app.
    config.ios.entitlements = setAppleAuthEntitlements(config, config.ios.entitlements || {});
    return config;
};
function setAppleAuthEntitlements(config, entitlements) {
    var _a;
    if ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.usesAppleSignIn) {
        entitlements['com.apple.developer.applesignin'] = ['Default'];
    }
    return entitlements;
}
exports.setAppleAuthEntitlements = setAppleAuthEntitlements;
