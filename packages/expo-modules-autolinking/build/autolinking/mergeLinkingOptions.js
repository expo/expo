"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectPackageJsonPathAsync = getProjectPackageJsonPathAsync;
exports.getProjectPackageJsonPathSync = getProjectPackageJsonPathSync;
exports.createLinkingOptionsFactory = createLinkingOptionsFactory;
exports.mergeLinkingOptionsAsync = mergeLinkingOptionsAsync;
exports.resolveSearchPaths = resolveSearchPaths;
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function loadPackageJSONAsync(packageJsonPath) {
    const packageJsonText = await fs_1.default.promises.readFile(packageJsonPath, 'utf8');
    return JSON.parse(packageJsonText);
}
/**
 * Find the path to the `package.json` of the closest project in the given project root.
 */
async function getProjectPackageJsonPathAsync(projectRoot) {
    const result = await (0, find_up_1.default)('package.json', { cwd: projectRoot });
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${projectRoot}"`);
    }
    return result;
}
/**
 * Synchronous version of {@link getProjectPackageJsonPathAsync}.
 */
function getProjectPackageJsonPathSync(projectRoot) {
    const result = find_up_1.default.sync('package.json', { cwd: projectRoot });
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${projectRoot}"`);
    }
    return result;
}
function createLinkingOptionsFactory(providedOptions) {
    let _packageJsonPath;
    const getPackageJsonPath = async () => {
        return (_packageJsonPath ||
            (_packageJsonPath = getProjectPackageJsonPathAsync(providedOptions.projectRoot)));
    };
    let _baseOptions;
    const getBaseOptions = async () => {
        if (!_baseOptions) {
            _baseOptions = loadPackageJSONAsync(await getPackageJsonPath()).then((packageJson) => {
                return packageJson.expo?.autolinking;
            });
        }
        return _baseOptions;
    };
    return {
        async getProjectRoot() {
            return path_1.default.dirname(await getPackageJsonPath());
        },
        async getPlatformOptions(platform = providedOptions.platform) {
            const baseOptions = await getBaseOptions();
            const platformOptions = getPlatformOptions(platform, baseOptions);
            const finalOptions = Object.assign({}, baseOptions, platformOptions, providedOptions);
            // Makes provided paths absolute or falls back to default paths if none was provided.
            finalOptions.searchPaths = resolveSearchPaths(finalOptions.searchPaths || [], providedOptions.projectRoot);
            finalOptions.nativeModulesDir = await resolveNativeModulesDirAsync(finalOptions.nativeModulesDir, providedOptions.projectRoot);
            // We shouldn't assume that `projectRoot` (which typically is CWD) is already at the project root
            finalOptions.projectRoot = await this.getProjectRoot();
            return finalOptions;
        },
    };
}
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.apple`)
 * - options provided to the CLI command
 */
async function mergeLinkingOptionsAsync(providedOptions) {
    return await createLinkingOptionsFactory(providedOptions).getPlatformOptions();
}
/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
function resolveSearchPaths(searchPaths, cwd) {
    return searchPaths?.map((searchPath) => path_1.default.resolve(cwd, searchPath)) || [];
}
/**
 * Finds the real path to custom native modules directory.
 * - When {@link cwd} is inside the project directory, the path is searched relatively
 * to the project root (directory with the `package.json` file).
 * - When {@link cwd} is outside project directory (no `package.json` found), it is relative to
 * the current working directory (the {@link cwd} param).
 *
 * @param nativeModulesDir path to custom native modules directory. Defaults to `"./modules"` if null.
 * @param cwd current working directory
 * @returns resolved native modules directory or `null` if it is not found or doesn't exist.
 */
async function resolveNativeModulesDirAsync(nativeModulesDir, cwd) {
    const packageJsonPath = await (0, find_up_1.default)('package.json', { cwd });
    const projectRoot = packageJsonPath != null ? path_1.default.join(packageJsonPath, '..') : cwd;
    const resolvedPath = path_1.default.resolve(projectRoot, nativeModulesDir || 'modules');
    return fs_1.default.existsSync(resolvedPath) ? resolvedPath : null;
}
/**
 * Gets the platform-specific autolinking options from the base options.
 */
function getPlatformOptions(platform, options) {
    if (platform === 'apple') {
        return options?.apple ?? options?.ios ?? {};
    }
    return options?.[platform] ?? {};
}
//# sourceMappingURL=mergeLinkingOptions.js.map