"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withDocumentPickerIOS_1 = require("./withDocumentPickerIOS");
const pkg = require('expo-document-picker/package.json');
const withDocumentPicker = (config, { appleTeamId = process.env.EXPO_APPLE_TEAM_ID } = {}) => {
    config = withDocumentPickerIOS_1.withDocumentPickerIOS(config, { appleTeamId });
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withDocumentPicker, pkg.name, pkg.version);
