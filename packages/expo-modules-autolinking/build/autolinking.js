"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageListAsync = exports.resolveModulesAsync = exports.verifySearchResults = exports.mergeLinkingOptionsAsync = exports.findModulesAsync = exports.resolveNativeModulesDirAsync = exports.findDefaultPathsAsync = exports.resolveSearchPathsAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const find_up_1 = __importDefault(require("find-up"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const module_1 = require("module");
const path_1 = __importDefault(require("path"));
const ExpoModuleConfig_1 = require("./ExpoModuleConfig");
// Names of the config files. From lowest to highest priority.
const EXPO_MODULE_CONFIG_FILENAMES = ['unimodule.json', 'expo-module.config.json'];
/**
 * Path to the `package.json` of the closest project in the current working dir.
 */
const projectPackageJsonPath = find_up_1.default.sync('package.json', { cwd: process.cwd() });
// This won't happen in usual scenarios, but we need to unwrap the optional path :)
if (!projectPackageJsonPath) {
    throw new Error(`Couldn't find "package.json" up from path "${process.cwd()}"`);
}
/**
 * Custom `require` that resolves from the current working dir instead of this script path.
 * **Requires Node v12.2.0**
 */
const projectRequire = (0, module_1.createRequire)(projectPackageJsonPath);
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
    }
    return paths;
}
exports.findDefaultPathsAsync = findDefaultPathsAsync;
// TODO: (barthap): WIP, just a temporary solution, improve this
// make it work the same way as findDefaultPathsAsync
// @returns undefined if custom modules dir doesn't exist
async function resolveNativeModulesDirAsync(nativeModulesDir, cwd) {
    // const up = await findUp('package.json', { cwd });
    // if (!up) {
    //   return undefined;
    // }
    // const resolvedPath = path.join(up, '..', nativeModulesDir || 'modules');
    // console.log(resolvedPath);
    // return fs.existsSync(resolvedPath) ? resolvedPath : 'xdd';
    return path_1.default.resolve(nativeModulesDir || 'modules');
}
exports.resolveNativeModulesDirAsync = resolveNativeModulesDirAsync;
/**
 * Adds {@link revision} to the {@link results} map
 * or to package duplicates if it already exists.
 * @param results [mutable] yet resolved packages map
 * @param name resolved package name
 * @param revision resolved package revision
 */
function addRevisionToResults(results, name, revision) {
    var _a, _b, _c, _d, _e;
    if (!results.has(name)) {
        // The revision that was found first will be the main one.
        // An array of duplicates and the config are needed only here.
        results.set(name, {
            ...revision,
            duplicates: [],
        });
    }
    else if (((_a = results.get(name)) === null || _a === void 0 ? void 0 : _a.path) !== revision.path &&
        ((_c = (_b = results.get(name)) === null || _b === void 0 ? void 0 : _b.duplicates) === null || _c === void 0 ? void 0 : _c.every(({ path }) => path !== revision.path))) {
        const { config, duplicates, ...duplicateEntry } = revision;
        (_e = (_d = results.get(name)) === null || _d === void 0 ? void 0 : _d.duplicates) === null || _e === void 0 ? void 0 : _e.push(duplicateEntry);
    }
}
/**
 * Returns paths to the highest priority config files, relative to the {@link searchPath}.
 * @example
 * ```
 * // Given the following file exists: /foo/myapp/modules/mymodule/expo-module.config.json
 * await findPackagesConfigPathsAsync('/foo/myapp/modules');
 * // returns ['mymodule/expo-module.config.json']
 * ```
 */
async function findPackagesConfigPathsAsync(searchPath) {
    const bracedFilenames = '{' + EXPO_MODULE_CONFIG_FILENAMES.join(',') + '}';
    const paths = await (0, fast_glob_1.default)([`*/${bracedFilenames}`, `@*/*/${bracedFilenames}`], {
        cwd: searchPath,
    });
    // If the package has multiple configs (e.g. `unimodule.json` and `expo-module.config.json` during the transition time)
    // then we want to give `expo-module.config.json` the priority.
    return Object.values(paths.reduce((acc, configPath) => {
        const dirname = path_1.default.dirname(configPath);
        if (!acc[dirname] || configPriority(configPath) > configPriority(acc[dirname])) {
            acc[dirname] = configPath;
        }
        return acc;
    }, {}));
}
/**
 * Resolves package name and version for the given {@link packagePath} from its `package.json`.
 * if {@link options.fallbackToDirName} is true, it returns the dir name when `package.json` doesn't exist.
 */
function resolvePackageNameAndVersion(packagePath, options = {}) {
    try {
        const { name, version } = require(path_1.default.join(packagePath, 'package.json'));
        return { name, version };
    }
    catch (e) {
        if (options.fallbackToDirName) {
            // we don't have the package.json name, so we'll use the directory name
            return {
                name: path_1.default.basename(packagePath),
                version: 'UNVERSIONED',
            };
        }
        else {
            throw e;
        }
    }
}
/**
 * Searches for modules to link based on given config.
 * TODO: (barthap): still duplicated code
 */
async function findModulesAsync(providedOptions) {
    var _a;
    const options = await mergeLinkingOptionsAsync(providedOptions);
    const results = new Map();
    const nativeModuleResults = new Map();
    if (options.nativeModulesDir && fs_extra_1.default.existsSync(options.nativeModulesDir)) {
        const packageConfigPaths = await findPackagesConfigPathsAsync(options.nativeModulesDir);
        for (const packageConfigPath of packageConfigPaths) {
            const packagePath = await fs_extra_1.default.realpath(path_1.default.join(options.nativeModulesDir, path_1.default.dirname(packageConfigPath)));
            const expoModuleConfig = (0, ExpoModuleConfig_1.requireAndResolveExpoModuleConfig)(path_1.default.join(packagePath, path_1.default.basename(packageConfigPath)));
            if (!expoModuleConfig.supportsPlatform(options.platform)) {
                continue;
            }
            const { name, version } = resolvePackageNameAndVersion(packagePath, {
                fallbackToDirName: true,
            });
            const currentRevision = {
                path: packagePath,
                version,
                config: expoModuleConfig,
            };
            addRevisionToResults(nativeModuleResults, name, currentRevision);
        }
    }
    for (const searchPath of options.searchPaths) {
        // nativeModulesDir was already processed, so we skip it
        // in case someone specified it in the search paths.
        if (options.nativeModulesDir === searchPath) {
            continue;
        }
        const packageConfigPaths = await findPackagesConfigPathsAsync(searchPath);
        for (const packageConfigPath of packageConfigPaths) {
            const packagePath = await fs_extra_1.default.realpath(path_1.default.join(searchPath, path_1.default.dirname(packageConfigPath)));
            const expoModuleConfig = (0, ExpoModuleConfig_1.requireAndResolveExpoModuleConfig)(path_1.default.join(packagePath, path_1.default.basename(packageConfigPath)));
            const { name, version } = resolvePackageNameAndVersion(packagePath);
            if (((_a = options.exclude) === null || _a === void 0 ? void 0 : _a.includes(name)) || !expoModuleConfig.supportsPlatform(options.platform)) {
                continue;
            }
            const currentRevision = {
                path: packagePath,
                version,
                config: expoModuleConfig,
            };
            addRevisionToResults(results, name, currentRevision);
        }
    }
    // It doesn't make much sense to strip modules if there is only one search path.
    // Workspace root usually doesn't specify all its dependencies (see Expo Go),
    // so in this case we should link everything.
    const searchResults = Object.fromEntries(results.entries());
    const filteredResults = options.searchPaths.length > 1
        ? filterToProjectDependencies(searchResults, providedOptions)
        : searchResults;
    // Custom native modules are not filtered out
    // when they're not specified in package.json dependencies.
    // Moreover, they override the native modules from the dependencies.
    return {
        ...filteredResults,
        ...Object.fromEntries(nativeModuleResults.entries()),
    };
}
exports.findModulesAsync = findModulesAsync;
/**
 * Filters out packages that are not the dependencies of the project.
 */
function filterToProjectDependencies(results, options = {}) {
    const filteredResults = {};
    const visitedPackages = new Set();
    // Helper for traversing the dependency hierarchy.
    function visitPackage(packageJsonPath) {
        const packageJson = require(packageJsonPath);
        // Prevent getting into the recursive loop.
        if (visitedPackages.has(packageJson.name)) {
            return;
        }
        visitedPackages.add(packageJson.name);
        // Iterate over the dependencies to find transitive modules.
        for (const dependencyName in packageJson.dependencies) {
            const dependencyResult = results[dependencyName];
            if (!filteredResults[dependencyName]) {
                let dependencyPackageJsonPath;
                if (dependencyResult) {
                    filteredResults[dependencyName] = dependencyResult;
                    dependencyPackageJsonPath = path_1.default.join(dependencyResult.path, 'package.json');
                }
                else {
                    try {
                        dependencyPackageJsonPath = projectRequire.resolve(`${dependencyName}/package.json`);
                    }
                    catch (error) {
                        // Some packages don't include package.json in its `exports` field,
                        // but none of our packages do that, so it seems fine to just ignore that type of error.
                        // Related issue: https://github.com/react-native-community/cli/issues/1168
                        if (!options.silent && error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
                            console.warn(chalk_1.default.yellow(`⚠️  Cannot resolve the path to "${dependencyName}" package.`));
                        }
                        continue;
                    }
                }
                // Visit the dependency package.
                visitPackage(dependencyPackageJsonPath);
            }
        }
    }
    // Visit project's package.
    visitPackage(projectPackageJsonPath);
    return filteredResults;
}
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.ios`)
 * - options provided to the CLI command
 */
async function mergeLinkingOptionsAsync(providedOptions) {
    var _a;
    const packageJson = require(projectPackageJsonPath);
    const baseOptions = (_a = packageJson.expo) === null || _a === void 0 ? void 0 : _a.autolinking;
    const platformOptions = providedOptions.platform && (baseOptions === null || baseOptions === void 0 ? void 0 : baseOptions[providedOptions.platform]);
    const finalOptions = Object.assign({}, baseOptions, platformOptions, providedOptions);
    // Makes provided paths absolute or falls back to default paths if none was provided.
    finalOptions.searchPaths = await resolveSearchPathsAsync(finalOptions.searchPaths, process.cwd());
    finalOptions.nativeModulesDir = await resolveNativeModulesDirAsync(finalOptions.nativeModulesDir, process.cwd());
    // TODO: (barthap): remove these console.logs when done ;)
    console.log(finalOptions.searchPaths);
    console.log(finalOptions.nativeModulesDir);
    return finalOptions;
}
exports.mergeLinkingOptionsAsync = mergeLinkingOptionsAsync;
/**
 * Verifies the search results by checking whether there are no duplicates.
 */
function verifySearchResults(searchResults) {
    var _a;
    const cwd = process.cwd();
    const relativePath = (pkg) => path_1.default.relative(cwd, pkg.path);
    let counter = 0;
    for (const moduleName in searchResults) {
        const revision = searchResults[moduleName];
        if ((_a = revision.duplicates) === null || _a === void 0 ? void 0 : _a.length) {
            console.warn(`⚠️  Found multiple revisions of ${chalk_1.default.green(moduleName)}`);
            console.log(` - ${chalk_1.default.magenta(relativePath(revision))} (${chalk_1.default.cyan(revision.version)})`);
            for (const duplicate of revision.duplicates) {
                console.log(` - ${chalk_1.default.gray(relativePath(duplicate))} (${chalk_1.default.gray(duplicate.version)})`);
            }
            counter++;
        }
    }
    if (counter > 0) {
        console.warn('⚠️  Please get rid of multiple revisions as it may introduce some side effects or compatibility issues');
    }
    return counter;
}
exports.verifySearchResults = verifySearchResults;
/**
 * Resolves search results to a list of platform-specific configuration.
 */
async function resolveModulesAsync(searchResults, options) {
    const platformLinking = require(`./platforms/${options.platform}`);
    return (await Promise.all(Object.entries(searchResults).map(async ([packageName, revision]) => {
        const resolvedModule = await platformLinking.resolveModuleAsync(packageName, revision, options);
        return resolvedModule
            ? {
                packageName,
                packageVersion: revision.version,
                ...resolvedModule,
            }
            : null;
    })))
        .filter(Boolean)
        .sort((a, b) => a.packageName.localeCompare(b.packageName));
}
exports.resolveModulesAsync = resolveModulesAsync;
/**
 * Generates a source file listing all packages to link.
 * Right know it works only for Android platform.
 */
async function generatePackageListAsync(modules, options) {
    try {
        const platformLinking = require(`./platforms/${options.platform}`);
        await platformLinking.generatePackageListAsync(modules, options.target, options.namespace);
    }
    catch (e) {
        console.error(chalk_1.default.red(`Generating package list is not available for platform: ${options.platform}`));
        throw e;
    }
}
exports.generatePackageListAsync = generatePackageListAsync;
/**
 * Returns the priority of the config at given path. Higher number means higher priority.
 */
function configPriority(fullpath) {
    return EXPO_MODULE_CONFIG_FILENAMES.indexOf(path_1.default.basename(fullpath));
}
//# sourceMappingURL=autolinking.js.map