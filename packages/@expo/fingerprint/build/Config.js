"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSourceSkips = exports.loadConfigAsync = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const SourceSkips_1 = require("./sourcer/SourceSkips");
const CONFIG_FILES = ['fingerprint.config.js', 'fingerprint.config.cjs'];
const debug = require('debug')('expo:fingerprint:Config');
/**
 * Load the fingerprint.config.js from project root.
 * @param projectRoot The project root directory.
 * @param silent Whether to mute console logs when loading the config. This is useful for expo-updates integration and makes sure the JSON output is valid.
 * @returns The loaded config or null if no config file was found.
 */
async function loadConfigAsync(projectRoot, silent = false) {
    let configFile;
    try {
        configFile = await resolveConfigFileAsync(projectRoot);
    }
    catch {
        return null;
    }
    debug('Resolved config file:', configFile);
    const unregisterMuteLogs = silent ? muteLogs() : null;
    let rawConfig;
    try {
        rawConfig = require(configFile);
    }
    catch (e) {
        debug('Error loading config file:', e);
        rawConfig = {};
    }
    unregisterMuteLogs?.();
    const supportedConfigKeys = [
        'concurrentIoLimit',
        'hashAlgorithm',
        'ignorePaths',
        'extraSources',
        'sourceSkips',
        'enableReactImportsPatcher',
        'useRNCoreAutolinkingFromExpo',
        'debug',
    ];
    const config = {};
    for (const key of supportedConfigKeys) {
        if (key in rawConfig) {
            if (key === 'sourceSkips') {
                config[key] = normalizeSourceSkips(rawConfig[key]);
            }
            else {
                config[key] = rawConfig[key];
            }
        }
    }
    return config;
}
exports.loadConfigAsync = loadConfigAsync;
/**
 * Normalize the sourceSkips from enum number or string array to a valid enum number.
 */
function normalizeSourceSkips(sourceSkips) {
    if (sourceSkips == null) {
        return SourceSkips_1.SourceSkips.None;
    }
    if (typeof sourceSkips === 'number') {
        return sourceSkips;
    }
    if (Array.isArray(sourceSkips)) {
        let result = SourceSkips_1.SourceSkips.None;
        for (const value of sourceSkips) {
            if (typeof value !== 'string') {
                continue;
            }
            const skipValue = SourceSkips_1.SourceSkips[value];
            if (skipValue != null) {
                result |= skipValue;
            }
        }
        return result;
    }
    throw new Error(`Invalid sourceSkips type: ${sourceSkips}`);
}
exports.normalizeSourceSkips = normalizeSourceSkips;
/**
 * Resolve the config file path from the project root.
 */
async function resolveConfigFileAsync(projectRoot) {
    return await Promise.any(CONFIG_FILES.map(async (file) => {
        const configPath = path_1.default.resolve(projectRoot, file);
        const stat = await promises_1.default.stat(configPath);
        if (!stat.isFile()) {
            throw new Error(`Config file is not a file: ${configPath}`);
        }
        return configPath;
    }));
}
/**
 * Monkey-patch the console to mute logs.
 * @returns A function to unregister the monkey-patch.
 */
function muteLogs() {
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };
    const unregister = () => {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
    };
    console.log = () => { };
    console.warn = () => { };
    console.error = () => { };
    return unregister;
}
//# sourceMappingURL=Config.js.map