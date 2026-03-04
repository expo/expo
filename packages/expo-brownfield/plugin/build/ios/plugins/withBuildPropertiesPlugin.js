"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expo_build_properties_1 = __importDefault(require("expo-build-properties"));
const withBuildPropertiesPlugin = (config, pluginConfig) => {
    return (0, expo_build_properties_1.default)(config, {
        ios: { buildReactNativeFromSource: pluginConfig.buildReactNativeFromSource },
    });
};
exports.default = withBuildPropertiesPlugin;
