"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findModulesAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const module_1 = require("module");
const path_1 = __importDefault(require("path"));
const ExpoModuleConfig_1 = require("../ExpoModuleConfig");
const mergeLinkingOptions_1 = require("./mergeLinkingOptions");
// Names of the config files. From lowest to highest priority.
const EXPO_MODULE_CONFIG_FILENAMES = ['unimodule.json', 'expo-module.config.json'];
/**
 * Searches for modules to link based on given config.
 */
async function findModulesAsync(providedOptions) {
    const options = await (0, mergeLinkingOptions_1.mergeLinkingOptionsAsync)(providedOptions);
    const results = new Map();
    const nativeModuleNames = new Set();
    // custom native modules should be resolved first so that they can override other modules
    const searchPaths = options.nativeModulesDir && fs_extra_1.default.existsSync(options.nativeModulesDir)
        ? [options.nativeModulesDir, ...options.searchPaths]
        : options.searchPaths;
    for (const searchPath of searchPaths) {
        const isNativeModulesDir = searchPath === options.nativeModulesDir;
        const packageConfigPaths = await findPackagesConfigPathsAsync(searchPath);
        for (const packageConfigPath of packageConfigPaths) {
            const packagePath = await fs_extra_1.default.realpath(path_1.default.join(searchPath, path_1.default.dirname(packageConfigPath)));
            const expoModuleConfig = (0, ExpoModuleConfig_1.requireAndResolveExpoModuleConfig)(path_1.default.join(packagePath, path_1.default.basename(packageConfigPath)));
            const { name, version } = resolvePackageNameAndVersion(packagePath, {
                fallbackToDirName: isNativeModulesDir,
            });
            // we ignore the `exclude` option for custom native modules
            if ((!isNativeModulesDir && options.exclude?.includes(name)) ||
                !expoModuleConfig.supportsPlatform(options.platform)) {
                continue;
            }
            // add the current revision to the results
            const currentRevision = {
                path: packagePath,
                version,
                config: expoModuleConfig,
            };
            addRevisionToResults(results, name, currentRevision);
            // if the module is a native module, we need to add it to the nativeModuleNames set
            if (isNativeModulesDir && !nativeModuleNames.has(name)) {
                nativeModuleNames.add(name);
            }
        }
    }
    const searchResults = Object.fromEntries(results.entries());
    // It doesn't make much sense to strip modules if there is only one search path.
    // (excluding custom native modules path)
    // Workspace root usually doesn't specify all its dependencies (see Expo Go),
    // so in this case we should link everything.
    if (options.searchPaths.length <= 1) {
        return searchResults;
    }
    return filterToProjectDependencies(searchResults, {
        ...providedOptions,
        // Custom native modules are not filtered out
        // when they're not specified in package.json dependencies.
        alwaysIncludedPackagesNames: nativeModuleNames,
    });
}
exports.findModulesAsync = findModulesAsync;
/**
 * Returns the priority of the config at given path. Higher number means higher priority.
 */
function configPriority(fullpath) {
    return EXPO_MODULE_CONFIG_FILENAMES.indexOf(path_1.default.basename(fullpath));
}
/**
 * Adds {@link revision} to the {@link results} map
 * or to package duplicates if it already exists.
 * @param results [mutable] yet resolved packages map
 * @param name resolved package name
 * @param revision resolved package revision
 */
function addRevisionToResults(results, name, revision) {
    if (!results.has(name)) {
        // The revision that was found first will be the main one.
        // An array of duplicates and the config are needed only here.
        results.set(name, {
            ...revision,
            duplicates: [],
        });
    }
    else if (results.get(name)?.path !== revision.path &&
        results.get(name)?.duplicates?.every(({ path }) => path !== revision.path)) {
        const { config, duplicates, ...duplicateEntry } = revision;
        results.get(name)?.duplicates?.push(duplicateEntry);
    }
}
/**
 * Returns paths to the highest priority config files, relative to the {@link searchPath}.
 * @example
 * ```
 * // Given the following file exists: /foo/myapp/modules/mymodule/expo-module.config.json
 * await findPackagesConfigPathsAsync('/foo/myapp/modules');
 * // returns ['mymodule/expo-module.config.json']
 *
 * await findPackagesConfigPathsAsync('/foo/myapp/modules/mymodule');
 * // returns ['expo-module.config.json']
 * ```
 */
async function findPackagesConfigPathsAsync(searchPath) {
    const bracedFilenames = '{' + EXPO_MODULE_CONFIG_FILENAMES.join(',') + '}';
    const paths = await (0, fast_glob_1.default)([`*/${bracedFilenames}`, `@*/*/${bracedFilenames}`, `./${bracedFilenames}`], {
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
 * if {@link fallbackToDirName} is true, it returns the dir name when `package.json` doesn't exist.
 * @returns object with `name` and `version` properties. `version` falls back to `UNVERSIONED` if cannot be resolved.
 */
function resolvePackageNameAndVersion(packagePath, { fallbackToDirName } = {}) {
    try {
        const { name, version } = require(path_1.default.join(packagePath, 'package.json'));
        return { name, version: version || 'UNVERSIONED' };
    }
    catch (e) {
        if (fallbackToDirName) {
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
 * Filters out packages that are not the dependencies of the project.
 */
function filterToProjectDependencies(results, options = {}) {
    const filteredResults = {};
    const visitedPackages = new Set();
    // iterate through always included package names and add them to the visited packages
    // if the results contains them
    for (const name of options.alwaysIncludedPackagesNames ?? []) {
        if (results[name] && !visitedPackages.has(name)) {
            filteredResults[name] = results[name];
            visitedPackages.add(name);
        }
    }
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
                        /**
                         * Custom `require` that resolves from the current working dir instead of this script path.
                         * **Requires Node v12.2.0**
                         */
                        const projectRequire = (0, module_1.createRequire)(packageJsonPath);
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
    visitPackage(mergeLinkingOptions_1.projectPackageJsonPath);
    return filteredResults;
}
//# sourceMappingURL=findModules.js.map