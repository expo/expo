"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageListAsync = exports.resolveModulesAsync = exports.verifySearchResults = exports.mergeLinkingOptionsAsync = exports.findModulesAsync = exports.findDefaultPathsAsync = exports.findPackageJsonPathAsync = exports.resolveSearchPathsAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const find_up_1 = __importDefault(require("find-up"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// TODO: Rename to `expo-module.json`
const EXPO_MODULE_CONFIG_FILENAME = 'unimodule.json';
/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
async function resolveSearchPathsAsync(searchPaths, cwd) {
    return searchPaths && searchPaths.length > 0
        ? searchPaths.map(searchPath => path_1.default.resolve(cwd, searchPath))
        : await findDefaultPathsAsync(cwd);
}
exports.resolveSearchPathsAsync = resolveSearchPathsAsync;
/**
 * Finds project's package.json and returns its path.
 */
async function findPackageJsonPathAsync() {
    var _a;
    return (_a = (await find_up_1.default('package.json', { cwd: process.cwd() }))) !== null && _a !== void 0 ? _a : null;
}
exports.findPackageJsonPathAsync = findPackageJsonPathAsync;
/**
 * Looks up for workspace's `node_modules` paths.
 */
async function findDefaultPathsAsync(cwd) {
    const paths = [];
    let dir = cwd;
    let pkgJsonPath;
    while ((pkgJsonPath = await find_up_1.default('package.json', { cwd: dir }))) {
        dir = path_1.default.dirname(path_1.default.dirname(pkgJsonPath));
        paths.push(path_1.default.join(pkgJsonPath, '..', 'node_modules'));
    }
    return paths;
}
exports.findDefaultPathsAsync = findDefaultPathsAsync;
/**
 * Searches for modules to link based on given config.
 */
async function findModulesAsync(providedOptions) {
    var _a, _b, _c, _d;
    const options = await mergeLinkingOptionsAsync(providedOptions);
    const results = {};
    for (const searchPath of options.searchPaths) {
        const paths = await fast_glob_1.default([`*/${EXPO_MODULE_CONFIG_FILENAME}`, `@*/*/${EXPO_MODULE_CONFIG_FILENAME}`], {
            cwd: searchPath,
        });
        for (const packageConfigPath of paths) {
            const packagePath = await fs_extra_1.default.realpath(path_1.default.join(searchPath, path_1.default.dirname(packageConfigPath)));
            const packageConfig = require(path_1.default.join(packagePath, EXPO_MODULE_CONFIG_FILENAME));
            const { name, version } = require(path_1.default.join(packagePath, 'package.json'));
            if (((_a = options.exclude) === null || _a === void 0 ? void 0 : _a.includes(name)) || !((_b = packageConfig.platforms) === null || _b === void 0 ? void 0 : _b.includes(options.platform))) {
                continue;
            }
            const currentRevision = {
                path: packagePath,
                version,
            };
            if (!results[name]) {
                // The revision that was found first will be the main one.
                // An array of duplicates is needed only here.
                results[name] = { ...currentRevision, duplicates: [] };
            }
            else if (results[name].path !== packagePath && ((_c = results[name].duplicates) === null || _c === void 0 ? void 0 : _c.every(({ path }) => path !== packagePath))) {
                (_d = results[name].duplicates) === null || _d === void 0 ? void 0 : _d.push(currentRevision);
            }
        }
    }
    return results;
}
exports.findModulesAsync = findModulesAsync;
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expoModules` field
 * - platform-specific options from the above (e.g. `expoModules.ios`)
 * - options provided to the CLI command
 */
async function mergeLinkingOptionsAsync(providedOptions) {
    var _a;
    const packageJsonPath = await findPackageJsonPathAsync();
    const packageJson = packageJsonPath ? require(packageJsonPath) : {};
    const baseOptions = (_a = packageJson.expo) === null || _a === void 0 ? void 0 : _a.autolinking;
    const platformOptions = providedOptions.platform && (baseOptions === null || baseOptions === void 0 ? void 0 : baseOptions[providedOptions.platform]);
    const finalOptions = Object.assign({}, baseOptions, platformOptions, providedOptions);
    // Makes provided paths absolute or falls back to default paths if none was provided.
    finalOptions.searchPaths = await resolveSearchPathsAsync(finalOptions.searchPaths, process.cwd());
    return finalOptions;
}
exports.mergeLinkingOptionsAsync = mergeLinkingOptionsAsync;
/**
 * Verifies the search results by checking whether there are no duplicates.
 */
function verifySearchResults(searchResults) {
    var _a;
    const cwd = process.cwd();
    const relativePath = pkg => path_1.default.relative(cwd, pkg.path);
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
    }
}
exports.generatePackageListAsync = generatePackageListAsync;
//# sourceMappingURL=autolinking.js.map