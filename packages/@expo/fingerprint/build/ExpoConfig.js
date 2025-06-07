"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoConfigAsync = getExpoConfigAsync;
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const ExpoConfigLoader_1 = require("./ExpoConfigLoader");
const SpawnIPC_1 = require("./utils/SpawnIPC");
/**
 * An out-of-process `expo/config` loader that can be used to get the Expo config and loaded modules.
 */
async function getExpoConfigAsync(projectRoot, options) {
    const result = {
        config: null,
        loadedModules: null,
    };
    if (!resolve_from_1.default.silent(path_1.default.resolve(projectRoot), 'expo/config')) {
        return result;
    }
    const tmpDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'expo-fingerprint-'));
    const ignoredFile = await createTempIgnoredFileAsync(tmpDir, options);
    try {
        const { message } = await (0, SpawnIPC_1.spawnWithIpcAsync)('node', [(0, ExpoConfigLoader_1.getExpoConfigLoaderPath)(), path_1.default.resolve(projectRoot), ignoredFile], { cwd: projectRoot });
        const stdoutJson = JSON.parse(message);
        result.config = stdoutJson.config;
        result.loadedModules = stdoutJson.loadedModules;
    }
    catch (e) {
        if (e instanceof Error) {
            console.warn(`Cannot get Expo config from an Expo project - ${e.message}: `, e.stack);
        }
    }
    finally {
        try {
            await promises_1.default.rm(tmpDir, { recursive: true });
        }
        catch { }
    }
    return result;
}
/**
 * Create a temporary file with ignored paths from options that will be read by the ExpoConfigLoader.
 */
async function createTempIgnoredFileAsync(tmpDir, options) {
    const ignoredFile = path_1.default.join(tmpDir, '.fingerprintignore');
    const ignorePaths = options.ignorePathMatchObjects.map((match) => match.pattern);
    await promises_1.default.writeFile(ignoredFile, ignorePaths.join('\n'));
    return ignoredFile;
}
//# sourceMappingURL=ExpoConfig.js.map