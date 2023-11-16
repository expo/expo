"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaticConfig = exports.getDynamicConfig = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const fs_1 = require("fs");
const Errors_1 = require("./Errors");
const evalConfig_1 = require("./evalConfig");
// We cannot use async config resolution right now because Next.js doesn't support async configs.
// If they don't add support for async Webpack configs then we may need to pull support for Next.js.
function readConfigFile(configFile, context) {
    // If the file doesn't exist then we should skip it and continue searching.
    if (!(0, fs_1.existsSync)(configFile)) {
        return null;
    }
    try {
        return (0, evalConfig_1.evalConfig)(configFile, context);
    }
    catch (error) {
        // @ts-ignore
        error.isConfigError = true;
        error.message = `Error reading Expo config at ${configFile}:\n\n${error.message}`;
        throw error;
    }
}
function getDynamicConfig(configPath, request) {
    const config = readConfigFile(configPath, request);
    if (config) {
        // The config must be serialized and evaluated ahead of time so the spawned process can send it over.
        return config;
    }
    // TODO: It seems this is only thrown if the file cannot be found (which may never happen).
    // If so we should throw a more helpful error.
    throw new Errors_1.ConfigError(`Failed to read config at: ${configPath}`, 'INVALID_CONFIG');
}
exports.getDynamicConfig = getDynamicConfig;
function getStaticConfig(configPath) {
    const config = json_file_1.default.read(configPath, { json5: true });
    if (config) {
        return config;
    }
    throw new Errors_1.ConfigError(`Failed to read config at: ${configPath}`, 'INVALID_CONFIG');
}
exports.getStaticConfig = getStaticConfig;
