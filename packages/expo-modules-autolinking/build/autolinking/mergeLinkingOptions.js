"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSearchPathsAsync = exports.mergeLinkingOptionsAsync = exports.projectPackageJsonPath = void 0;
const find_up_1 = __importDefault(require("find-up"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Path to the `package.json` of the closest project in the current working dir.
 */
exports.projectPackageJsonPath = find_up_1.default.sync('package.json', { cwd: process.cwd() });
// This won't happen in usual scenarios, but we need to unwrap the optional path :)
if (!exports.projectPackageJsonPath) {
    throw new Error(`Couldn't find "package.json" up from path "${process.cwd()}"`);
}
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.ios`)
 * - options provided to the CLI command
 */
async function mergeLinkingOptionsAsync(providedOptions) {
    var _a;
    const packageJson = require(exports.projectPackageJsonPath);
    const baseOptions = (_a = packageJson.expo) === null || _a === void 0 ? void 0 : _a.autolinking;
    const platformOptions = providedOptions.platform && (baseOptions === null || baseOptions === void 0 ? void 0 : baseOptions[providedOptions.platform]);
    const finalOptions = Object.assign({}, baseOptions, platformOptions, providedOptions);
    // Makes provided paths absolute or falls back to default paths if none was provided.
    finalOptions.searchPaths = await resolveSearchPathsAsync(finalOptions.searchPaths, process.cwd());
    finalOptions.nativeModulesDir = await resolveNativeModulesDirAsync(finalOptions.nativeModulesDir, process.cwd());
    return finalOptions;
}
exports.mergeLinkingOptionsAsync = mergeLinkingOptionsAsync;
/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
async function resolveSearchPathsAsync(searchPaths, cwd) {
    return searchPaths && searchPaths.length > 0
        ? searchPaths.map((searchPath) => path_1.default.resolve(cwd, searchPath))
        : await findDefaultPathsAsync(cwd);
}
exports.resolveSearchPathsAsync = resolveSearchPathsAsync;
/**
 * Looks up for workspace's `node_modules` paths.
 */
async function findDefaultPathsAsync(cwd) {
    const paths = [];
    let dir = cwd;
    let pkgJsonPath;
    while ((pkgJsonPath = await (0, find_up_1.default)('package.json', { cwd: dir }))) {
        dir = path_1.default.dirname(path_1.default.dirname(pkgJsonPath));
        paths.push(path_1.default.join(pkgJsonPath, '..', 'node_modules'));
        // This stops the infinite loop when the package.json is placed at the root dir.
        if (path_1.default.dirname(dir) === dir) {
            break;
        }
    }
    return paths;
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
    return fs_extra_1.default.existsSync(resolvedPath) ? resolvedPath : null;
}
//# sourceMappingURL=mergeLinkingOptions.js.map