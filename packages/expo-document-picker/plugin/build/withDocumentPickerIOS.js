"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setICloudEntitlements = exports.withDocumentPickerIOS = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withDocumentPickerIOS = (config, { iCloudContainerEnvironment } = {}) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        config.modResults = setICloudEntitlements(config, { iCloudContainerEnvironment }, config.modResults);
        return config;
    });
};
exports.withDocumentPickerIOS = withDocumentPickerIOS;
function setICloudEntitlements(config, { iCloudContainerEnvironment }, { 'com.apple.developer.icloud-container-environment': _env, ...entitlements }) {
    if (config.ios?.usesIcloudStorage) {
        // Used for AdHoc iOS builds: https://github.com/expo/eas-cli/issues/693
        // https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment
        entitlements['com.apple.developer.icloud-container-environment'] = iCloudContainerEnvironment;
        entitlements['com.apple.developer.icloud-container-identifiers'] = [
            `iCloud.${config.ios.bundleIdentifier}`,
        ];
        entitlements['com.apple.developer.ubiquity-container-identifiers'] = [
            `iCloud.${config.ios.bundleIdentifier}`,
        ];
        entitlements['com.apple.developer.ubiquity-kvstore-identifier'] = `$(TeamIdentifierPrefix)${config.ios.bundleIdentifier}`;
        entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    }
    return entitlements;
}
exports.setICloudEntitlements = setICloudEntitlements;
