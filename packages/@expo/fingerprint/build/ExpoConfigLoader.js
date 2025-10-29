"use strict";
/**
 * A helper script to load the Expo config and loaded plugins from a project
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoConfigLoaderPath = getExpoConfigLoaderPath;
const promises_1 = __importDefault(require("fs/promises"));
const module_1 = __importDefault(require("module"));
const node_assert_1 = __importDefault(require("node:assert"));
const node_process_1 = __importDefault(require("node:process"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const ExpoResolver_1 = require("./ExpoResolver");
const Options_1 = require("./Options");
const Path_1 = require("./utils/Path");
async function runAsync(programName, args = []) {
    if (args.length < 1) {
        console.log(`Usage: ${programName} <projectRoot> [ignoredFile]`);
        return;
    }
    const projectRoot = path_1.default.resolve(args[0]);
    const ignoredFile = args[1] ? path_1.default.resolve(args[1]) : null;
    // @ts-expect-error: module internal _cache
    const loadedModulesBefore = new Set(Object.keys(module_1.default._cache));
    const expoEnvPath = (0, ExpoResolver_1.resolveExpoEnvPath)(projectRoot);
    (0, node_assert_1.default)(expoEnvPath, `Could not find '@expo/env' package for the project from ${projectRoot}.`);
    require(expoEnvPath).load(projectRoot);
    setNodeEnv('development');
    const { getConfig } = require((0, resolve_from_1.default)(path_1.default.resolve(projectRoot), 'expo/config'));
    const config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
    // @ts-expect-error: module internal _cache
    const loadedModules = Object.keys(module_1.default._cache)
        .filter((modulePath) => !loadedModulesBefore.has(modulePath))
        .map((modulePath) => path_1.default.relative(projectRoot, modulePath));
    const ignoredPaths = [
        ...DEFAULT_CONFIG_LOADING_IGNORE_PATHS,
        ...(await loadIgnoredPathsAsync(ignoredFile)),
    ];
    const filteredLoadedModules = loadedModules.filter((modulePath) => !(0, Path_1.isIgnoredPath)(modulePath, ignoredPaths));
    const result = JSON.stringify({ config, loadedModules: filteredLoadedModules });
    if (node_process_1.default.send) {
        node_process_1.default.send(result);
    }
    else {
        console.log(result);
    }
}
// If running from the command line
if (require.main?.filename === __filename) {
    (async () => {
        const programIndex = node_process_1.default.argv.findIndex((arg) => arg === __filename);
        try {
            await runAsync(node_process_1.default.argv[programIndex], node_process_1.default.argv.slice(programIndex + 1));
        }
        catch (e) {
            console.error('Uncaught Error', e);
            node_process_1.default.exit(1);
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
    return ignorePaths;
}
/**
 * Get the path to the ExpoConfigLoader file.
 */
function getExpoConfigLoaderPath() {
    return path_1.default.join(__dirname, 'ExpoConfigLoader.js');
}
/**
 * Set the environment to production or development
 * Replicates the code from `@expo/cli` to ensure the same environment is set.
 */
function setNodeEnv(mode) {
    node_process_1.default.env.NODE_ENV = node_process_1.default.env.NODE_ENV || mode;
    node_process_1.default.env.BABEL_ENV = node_process_1.default.env.BABEL_ENV || node_process_1.default.env.NODE_ENV;
    // @ts-expect-error: Add support for external React libraries being loaded in the same process.
    globalThis.__DEV__ = node_process_1.default.env.NODE_ENV !== 'production';
}
// Ignore default javascript files when calling `getConfig()`
const DEFAULT_CONFIG_LOADING_IGNORE_PATHS = [
    // We don't want to include the whole project package.json from the ExpoConfigLoader phase.
    'package.json',
    '**/node_modules/@babel/**/*',
    '**/node_modules/@expo/**/*',
    '**/node_modules/@jridgewell/**/*',
    '**/node_modules/expo/config.js',
    '**/node_modules/expo/config-plugins.js',
    `**/node_modules/{${[
        'ajv',
        'ajv-formats',
        'ajv-keywords',
        'ansi-styles',
        'chalk',
        'debug',
        'dotenv',
        'dotenv-expand',
        'escape-string-regexp',
        'getenv',
        'graceful-fs',
        'fast-deep-equal',
        'fast-uri',
        'has-flag',
        'imurmurhash',
        'js-tokens',
        'json5',
        'json-schema-traverse',
        'ms',
        'picocolors',
        'lines-and-columns',
        'require-from-string',
        'resolve-from',
        'schema-utils',
        'signal-exit',
        'sucrase',
        'supports-color',
        'ts-interface-checker',
        'write-file-atomic',
    ].join(',')}}/**/*`,
];
//# sourceMappingURL=ExpoConfigLoader.js.map