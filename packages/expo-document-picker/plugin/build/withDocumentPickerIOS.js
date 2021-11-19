"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setICloudEntitlements = exports.withDocumentPickerIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withDocumentPickerIOS = (config, { appleTeamId, iCloudContainerEnvironment }) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        if (appleTeamId) {
            config.modResults = setICloudEntitlements(config, { appleTeamId, iCloudContainerEnvironment }, config.modResults);
        }
        else {
            config_plugins_1.WarningAggregator.addWarningIOS('expo-document-picker', 'Cannot configure iOS entitlements because neither the appleTeamId property, nor the environment variable EXPO_APPLE_TEAM_ID were defined.');
        }
        return config;
    });
};
exports.withDocumentPickerIOS = withDocumentPickerIOS;
function setICloudEntitlements(config, { appleTeamId, iCloudContainerEnvironment }, { 'com.apple.developer.icloud-container-environment': _env, ...entitlements }) {
    var _a;
    if ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.usesIcloudStorage) {
        // Used for AdHoc iOS builds: https://github.com/expo/eas-cli/issues/693
        // https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment
        entitlements['com.apple.developer.icloud-container-environment'] = iCloudContainerEnvironment;
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
exports.setICloudEntitlements = setICloudEntitlements;
