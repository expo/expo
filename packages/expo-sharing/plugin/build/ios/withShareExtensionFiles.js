"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withShareExtensionFiles = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const path_1 = __importDefault(require("path"));
const setupShareExtensionFiles_1 = require("./setupShareExtensionFiles");
const withShareExtensionFiles = (config, { targetName, appGroupId, urlScheme, activationRule, onFilesWritten }) => (0, config_plugins_1.withDangerousMod)(config, [
    'ios',
    async (config) => {
        const { platformProjectRoot } = config.modRequest;
        const targetPath = path_1.default.join(platformProjectRoot, targetName);
        const files = (0, setupShareExtensionFiles_1.setupShareExtensionFiles)(targetPath, targetName, appGroupId, urlScheme, activationRule);
        onFilesWritten(files);
        return config;
    },
]);
exports.withShareExtensionFiles = withShareExtensionFiles;
