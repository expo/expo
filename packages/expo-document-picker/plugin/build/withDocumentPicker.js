"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const assert_1 = __importDefault(require("assert"));
const pkg = require('expo-document-picker/package.json');
const withDocumentPicker = config => {
    var _a;
    const { bundleIdentifier } = (_a = config.ios) !== null && _a !== void 0 ? _a : {};
    assert_1.default(bundleIdentifier, 'expo-document-picker plugin requires `ios.bundleIdentifier` to be defined for iCloud entitlements. Learn more: https://docs.expo.io/versions/latest/sdk/document-picker/#configuration');
    const appleTeamId = process.env.EXPO_APPLE_TEAM_ID;
    assert_1.default(appleTeamId, 'expo-document-picker plugin requires the environment variable `EXPO_APPLE_TEAM_ID` to be defined for iCloud entitlements. Learn more: https://docs.expo.io/versions/latest/sdk/document-picker/#configuration');
    // TODO: Should we ignore if `config.ios?.usesIcloudStorage` is false?
    return config_plugins_1.withEntitlementsPlist(config, config => {
        const { modResults: entitlements } = config;
        entitlements['com.apple.developer.icloud-container-identifiers'] = [
            'iCloud.' + bundleIdentifier,
        ];
        entitlements['com.apple.developer.ubiquity-container-identifiers'] = [
            'iCloud.' + bundleIdentifier,
        ];
        entitlements['com.apple.developer.ubiquity-kvstore-identifier'] =
            appleTeamId + '.' + bundleIdentifier;
        entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];
        config.modResults = entitlements;
        return config;
    });
};
exports.default = config_plugins_1.createRunOncePlugin(withDocumentPicker, pkg.name, pkg.version);
