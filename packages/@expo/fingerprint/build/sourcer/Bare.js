"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoreAutolinkingSourcesFromExpoIos = exports.getCoreAutolinkingSourcesFromExpoAndroid = exports.getCoreAutolinkingSourcesFromRncCliAsync = exports.getGitIgnoreSourcesAsync = exports.getPackageJsonScriptSourcesAsync = exports.getBareIosSourcesAsync = exports.getBareAndroidSourcesAsync = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const assert_1 = __importDefault(require("assert"));
const chalk_1 = __importDefault(require("chalk"));
const node_process_1 = __importDefault(require("node:process"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const ExpoResolver_1 = require("../ExpoResolver");
const SourceSkips_1 = require("./SourceSkips");
const Utils_1 = require("./Utils");
const Path_1 = require("../utils/Path");
const debug = require('debug')('expo:fingerprint:sourcer:Bare');
async function getBareAndroidSourcesAsync(projectRoot, options) {
    if (options.platforms.includes('android')) {
        const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, 'android', 'bareNativeDir');
        if (result != null) {
            debug(`Adding bare native dir - ${chalk_1.default.dim('android')}`);
            return [result];
        }
    }
    return [];
}
exports.getBareAndroidSourcesAsync = getBareAndroidSourcesAsync;
async function getBareIosSourcesAsync(projectRoot, options) {
    if (options.platforms.includes('ios')) {
        const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, 'ios', 'bareNativeDir');
        if (result != null) {
            debug(`Adding bare native dir - ${chalk_1.default.dim('ios')}`);
            return [result];
        }
    }
    return [];
}
exports.getBareIosSourcesAsync = getBareIosSourcesAsync;
async function getPackageJsonScriptSourcesAsync(projectRoot, options) {
    if (options.sourceSkips & SourceSkips_1.SourceSkips.PackageJsonScriptsAll) {
        return [];
    }
    let packageJson;
    try {
        packageJson = require((0, resolve_from_1.default)(path_1.default.resolve(projectRoot), './package.json'));
    }
    catch (e) {
        debug(`Unable to read package.json from ${path_1.default.resolve(projectRoot)}/package.json: ` + e);
        return [];
    }
    const results = [];
    if (packageJson.scripts) {
        debug(`Adding package.json contents - ${chalk_1.default.dim('scripts')}`);
        const id = 'packageJson:scripts';
        results.push({
            type: 'contents',
            id,
            contents: normalizePackageJsonScriptSources(packageJson.scripts, options),
            reasons: [id],
        });
    }
    return results;
}
exports.getPackageJsonScriptSourcesAsync = getPackageJsonScriptSourcesAsync;
async function getGitIgnoreSourcesAsync(projectRoot, options) {
    if (options.sourceSkips & SourceSkips_1.SourceSkips.GitIgnore) {
        return [];
    }
    const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, '.gitignore', 'bareGitIgnore');
    if (result != null) {
        debug(`Adding file - ${chalk_1.default.dim('.gitignore')}`);
        return [result];
    }
    return [];
}
exports.getGitIgnoreSourcesAsync = getGitIgnoreSourcesAsync;
async function getCoreAutolinkingSourcesFromRncCliAsync(projectRoot, options, useRNCoreAutolinkingFromExpo) {
    if (useRNCoreAutolinkingFromExpo === true) {
        return [];
    }
    try {
        const { stdout } = await (0, spawn_async_1.default)('npx', ['react-native', 'config'], { cwd: projectRoot });
        const config = JSON.parse(stdout);
        const results = await parseCoreAutolinkingSourcesAsync({
            config,
            contentsId: 'rncoreAutolinkingConfig',
            reasons: ['rncoreAutolinking'],
        });
        return results;
    }
    catch (e) {
        debug(chalk_1.default.red(`Error adding react-native core autolinking sources.\n${e}`));
        return [];
    }
}
exports.getCoreAutolinkingSourcesFromRncCliAsync = getCoreAutolinkingSourcesFromRncCliAsync;
async function getCoreAutolinkingSourcesFromExpoAndroid(projectRoot, options, useRNCoreAutolinkingFromExpo) {
    if (useRNCoreAutolinkingFromExpo === false || !options.platforms.includes('android')) {
        return [];
    }
    try {
        const { stdout } = await (0, spawn_async_1.default)('node', [
            (0, ExpoResolver_1.resolveExpoAutolinkingCliPath)(projectRoot),
            'react-native-config',
            '--json',
            '--platform',
            'android',
        ], { cwd: projectRoot });
        const config = JSON.parse(stdout);
        const results = await parseCoreAutolinkingSourcesAsync({
            config,
            contentsId: 'rncoreAutolinkingConfig:android',
            reasons: ['rncoreAutolinkingAndroid'],
            platform: 'android',
        });
        return results;
    }
    catch (e) {
        debug(chalk_1.default.red(`Error adding react-native core autolinking sources for android.\n${e}`));
        return [];
    }
}
exports.getCoreAutolinkingSourcesFromExpoAndroid = getCoreAutolinkingSourcesFromExpoAndroid;
async function getCoreAutolinkingSourcesFromExpoIos(projectRoot, options, useRNCoreAutolinkingFromExpo) {
    if (useRNCoreAutolinkingFromExpo === false || !options.platforms.includes('ios')) {
        return [];
    }
    try {
        const { stdout } = await (0, spawn_async_1.default)('node', [
            (0, ExpoResolver_1.resolveExpoAutolinkingCliPath)(projectRoot),
            'react-native-config',
            '--json',
            '--platform',
            'ios',
        ], { cwd: projectRoot });
        const config = JSON.parse(stdout);
        const results = await parseCoreAutolinkingSourcesAsync({
            config,
            contentsId: 'rncoreAutolinkingConfig:ios',
            reasons: ['rncoreAutolinkingIos'],
            platform: 'ios',
        });
        return results;
    }
    catch (e) {
        debug(chalk_1.default.red(`Error adding react-native core autolinking sources for ios.\n${e}`));
        return [];
    }
}
exports.getCoreAutolinkingSourcesFromExpoIos = getCoreAutolinkingSourcesFromExpoIos;
async function parseCoreAutolinkingSourcesAsync({ config, reasons, contentsId, platform, }) {
    const logTag = platform
        ? `react-native core autolinking dir for ${platform}`
        : 'react-native core autolinking dir';
    const results = [];
    const { root } = config;
    const autolinkingConfig = {};
    for (const [depName, depData] of Object.entries(config.dependencies)) {
        try {
            stripRncoreAutolinkingAbsolutePaths(depData, root);
            const filePath = (0, Path_1.toPosixPath)(depData.root);
            debug(`Adding ${logTag} - ${chalk_1.default.dim(filePath)}`);
            results.push({ type: 'dir', filePath, reasons });
            autolinkingConfig[depName] = depData;
        }
        catch (e) {
            debug(chalk_1.default.red(`Error adding ${logTag} - ${depName}.\n${e}`));
        }
    }
    results.push({
        type: 'contents',
        id: contentsId,
        contents: JSON.stringify(autolinkingConfig),
        reasons,
    });
    return results;
}
function stripRncoreAutolinkingAbsolutePaths(dependency, root) {
    (0, assert_1.default)(dependency.root);
    const dependencyRoot = dependency.root;
    const cmakeDepRoot = node_process_1.default.platform === 'win32' ? dependencyRoot.replace(/\\/g, '/') : dependencyRoot;
    dependency.root = (0, Path_1.toPosixPath)(path_1.default.relative(root, dependencyRoot));
    for (const platformData of Object.values(dependency.platforms)) {
        for (const [key, value] of Object.entries(platformData ?? {})) {
            let newValue;
            if (node_process_1.default.platform === 'win32' &&
                ['cmakeListsPath', 'cxxModuleCMakeListsPath'].includes(key)) {
                // CMake paths on Windows are serving in slashes,
                // we have to check startsWith with the same slashes.
                newValue = value?.startsWith?.(cmakeDepRoot)
                    ? (0, Path_1.toPosixPath)(path_1.default.relative(root, value))
                    : value;
            }
            else {
                newValue = value?.startsWith?.(dependencyRoot)
                    ? (0, Path_1.toPosixPath)(path_1.default.relative(root, value))
                    : value;
            }
            platformData[key] = newValue;
        }
    }
}
function normalizePackageJsonScriptSources(scripts, options) {
    if (options.sourceSkips & SourceSkips_1.SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun) {
        // Replicate the behavior of `expo prebuild`
        if (!scripts.android?.includes('run') || scripts.android === 'expo run:android') {
            delete scripts.android;
        }
        if (!scripts.ios?.includes('run') || scripts.ios === 'expo run:ios') {
            delete scripts.ios;
        }
    }
    return JSON.stringify(scripts);
}
//# sourceMappingURL=Bare.js.map