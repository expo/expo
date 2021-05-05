"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationsIOS = void 0;
exports.withNotificationsIOS = (config, { mode }) => {
    // Statically setting the entitlements outside of the entitlements mod so tools like eas-cli
    // can determine which capabilities to enable before building the app.
    if (!config.ios)
        config.ios = {};
    if (!config.ios.entitlements)
        config.ios.entitlements = {};
    config.ios.entitlements['aps-environment'] = mode;
    return config;
};
