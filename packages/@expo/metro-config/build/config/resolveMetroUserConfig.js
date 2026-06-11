"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMetroUserConfig = resolveMetroUserConfig;
const json_file_1 = __importDefault(require("@expo/json-file"));
const require_utils_1 = require("@expo/require-utils");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function isPathInside(child, parent) {
    const relative = node_path_1.default.relative(parent, child);
    return !!relative && !relative.startsWith('..') && !node_path_1.default.isAbsolute(relative);
}
const configExtensions = ['.js', '.cjs', '.mjs', '.json', '.ts', '.cts', '.mts'];
const resolveConfigFromPath = (filePath, projectRoot) => {
    const inputPath = node_path_1.default.resolve(process.cwd(), filePath);
    const normalized = `.${node_path_1.default.sep}${node_path_1.default.relative(projectRoot, inputPath)}`;
    const resolved = (0, require_utils_1.resolveFrom)(projectRoot, normalized, { extensions: configExtensions });
    return resolved ?? inputPath;
};
const resolvePackageJsonConfig = (searchPath) => {
    const target = node_path_1.default.resolve(searchPath, 'package.json');
    const stat = node_fs_1.default.lstatSync(target, { throwIfNoEntry: false });
    if (!stat?.isFile()) {
        return null;
    }
    const json = new json_file_1.default(target).read();
    if (json.metro != null && typeof json.metro === 'object' && !Array.isArray(json.metro)) {
        return {
            filePath: target,
            config: json.metro,
        };
    }
    else {
        return null;
    }
};
const loadConfigFile = async (configPath) => {
    if (configPath.endsWith('.json')) {
        const json = new json_file_1.default(configPath).read();
        return node_path_1.default.basename(configPath) === 'package.json' ? json.metro : json;
    }
    // Using sync variant to match Expo config/config-plugins
    const mod = (0, require_utils_1.loadModuleSync)(configPath);
    return await (mod.__esModule ? mod.default : mod);
};
const _resolutionCache = new Map();
async function resolveMetroUserConfig(params) {
    let configPath = null;
    if (params.overrideConfigPath) {
        configPath = resolveConfigFromPath(params.overrideConfigPath, params.projectRoot);
    }
    else if (_resolutionCache.has(params.projectRoot)) {
        configPath = _resolutionCache.get(params.projectRoot);
    }
    else {
        // NOTE(@kitten): Metro usually traverses beyond the server root, but we deem this unsafe
        const startPath = node_path_1.default.resolve(params.projectRoot);
        const stopPath = node_path_1.default.resolve(params.serverRoot);
        // Search upwards until the server root
        let searchPath = startPath;
        while (configPath == null && (searchPath === stopPath || isPathInside(searchPath, stopPath))) {
            configPath = (0, require_utils_1.resolveFrom)(searchPath, './metro.config', { extensions: configExtensions });
            // Metro searches for .config/metro.[ext] next
            if (configPath == null) {
                configPath = (0, require_utils_1.resolveFrom)(searchPath, './.config/metro', { extensions: configExtensions });
            }
            if (configPath == null && searchPath === startPath) {
                // At each level, also check the package.json for "metro" entry
                // NOTE(@kitten): Metro actually searches in each package.json upwards, but we're dropping
                // support for this, since this is very unexpected
                const packageJsonResult = resolvePackageJsonConfig(searchPath);
                if (packageJsonResult) {
                    configPath = packageJsonResult.filePath;
                    break;
                }
            }
            // Protect against `serverRoot === '/'` edge case
            const prevDir = searchPath;
            searchPath = node_path_1.default.dirname(searchPath);
            if (prevDir === searchPath) {
                break;
            }
        }
        // We want to avoid doing this whole search again since it's very expensive
        if (configPath != null) {
            _resolutionCache.set(params.projectRoot, configPath);
        }
    }
    if (configPath == null) {
        // No config file found, return a default
        return {
            isEmpty: true,
            filepath: node_path_1.default.join(params.projectRoot, 'metro.config.stub.js'),
            config: {},
        };
    }
    else {
        return {
            isEmpty: false,
            filepath: configPath,
            config: await loadConfigFile(configPath),
        };
    }
}
//# sourceMappingURL=resolveMetroUserConfig.js.map