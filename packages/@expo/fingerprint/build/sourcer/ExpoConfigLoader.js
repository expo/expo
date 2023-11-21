"use strict";
/**
 * A helper script to load the Expo config and loaded plugins from a project
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoConfigLoaderPath = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const Options_1 = require("../Options");
const Path_1 = require("../utils/Path");
async function runAsync(programName, args = []) {
    if (args.length < 1) {
        console.log(`Usage: ${programName} <projectRoot> [ignoredFile]`);
        return;
    }
    const projectRoot = path_1.default.resolve(args[0]);
    const ignoredFile = args[1] ? path_1.default.resolve(args[1]) : null;
    // @ts-expect-error: module internal _cache
    const loadedModulesBefore = new Set(Object.keys(module_1.default._cache));
    const { getConfig } = require((0, resolve_from_1.default)(path_1.default.resolve(projectRoot), 'expo/config'));
    const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
    // @ts-expect-error: module internal _cache
    const loadedModules = Object.keys(module_1.default._cache)
        .filter((modulePath) => !loadedModulesBefore.has(modulePath))
        .map((modulePath) => path_1.default.relative(projectRoot, modulePath));
    const ignoredPaths = await loadIgnoredPathsAsync(ignoredFile);
    const filteredLoadedModules = loadedModules.filter((modulePath) => !(0, Path_1.isIgnoredPath)(modulePath, ignoredPaths));
    console.log(JSON.stringify({ config, loadedModules: filteredLoadedModules }));
}
// If running from the command line
if (require.main?.filename === __filename) {
    (async () => {
        const programIndex = process.argv.findIndex((arg) => arg === __filename);
        try {
            await runAsync(process.argv[programIndex], process.argv.slice(programIndex + 1));
        }
        catch (e) {
            console.error('Uncaught Error', e);
            process.exit(1);
        }
    })();
}
/**
 * Load the generated ignored paths file from caller and remove the file after loading
 */
async function loadIgnoredPathsAsync(ignoredFile) {
    if (!ignoredFile) {
        return Options_1.DEFAULT_IGNORE_PATHS;
    }
    const ignorePaths = [];
    try {
        const fingerprintIgnore = await promises_1.default.readFile(ignoredFile, 'utf8');
        const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
        for (const line of fingerprintIgnoreLines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                ignorePaths.push(trimmedLine);
            }
        }
    }
    catch { }
    try {
        await promises_1.default.rm(ignoredFile);
    }
    catch { }
    return ignorePaths;
}
/**
 * Get the path to the ExpoConfigLoader file.
 */
function getExpoConfigLoaderPath() {
    return path_1.default.join(__dirname, 'ExpoConfigLoader.js');
}
exports.getExpoConfigLoaderPath = getExpoConfigLoaderPath;
//# sourceMappingURL=ExpoConfigLoader.js.map