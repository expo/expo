"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setICloudEntitlments = exports.withDocumentPickerIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
exports.withDocumentPickerIOS = (config, { appleTeamId }) => {
    if (appleTeamId) {
        // Statically setting the entitlements outside of the entitlements mod so tools like eas-cli
        // can determine which capabilities to enable before building the app.
        if (!config.ios)
            config.ios = {};
        config.ios.entitlements = setICloudEntitlments(config, appleTeamId, config.ios.entitlements || {});
    }
    else {
        config_plugins_1.WarningAggregator.addWarningIOS('expo-document-picker', 'Cannot configure iOS entitlements because neither the appleTeamId property, nor the environment variable EXPO_APPLE_TEAM_ID were defined.');
    }
    return config;
};
function setICloudEntitlments(config, appleTeamId, entitlements) {
    var _a;
    if ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.usesIcloudStorage) {
        entitlements['com.apple.developer.icloud-container-identifiers'] = [
            'iCloud.' + config.ios.bundleIdentifier,
        ];
        entitlements['com.apple.developer.ubiquity-container-identifiers'] = [
            'iCloud.' + config.ios.bundleIdentifier,
        ];
        entitlements['com.apple.developer.ubiquity-kvstore-identifier'] =
            appleTeamId + '.' + config.ios.bundleIdentifier;
        entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    }
    return entitlements;
}
exports.setICloudEntitlments = setICloudEntitlments;
