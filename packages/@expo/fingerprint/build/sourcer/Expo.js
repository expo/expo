"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortExpoAutolinkingAndroidConfig = exports.getExpoAutolinkingIosSourcesAsync = exports.getExpoAutolinkingAndroidSourcesAsync = exports.getEasBuildSourcesAsync = exports.getExpoConfigSourcesAsync = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const Utils_1 = require("./Utils");
const findDependencies_1 = require("./findDependencies");
const Profile_1 = require("../utils/Profile");
const debug = require('debug')('expo:fingerprint:sourcer:Expo');
async function getExpoConfigSourcesAsync(projectRoot, options) {
    const results = [];
    let config;
    try {
        const { getConfig } = require((0, resolve_from_1.default)(path_1.default.resolve(projectRoot), 'expo/config'));
        config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
        results.push({
            type: 'contents',
            id: 'expoConfig',
            contents: normalizeExpoConfig(config.exp),
            reasons: ['expoConfig'],
        });
    }
    catch (e) {
        debug('Cannot get Expo config: ' + e);
        return [];
    }
    // external files in config
    const isAndroid = options.platforms.includes('android');
    const isIos = options.platforms.includes('ios');
    const externalFiles = [
        // icons
        config.exp.icon,
        isAndroid ? config.exp.android?.icon : undefined,
        isIos ? config.exp.ios?.icon : undefined,
        isAndroid ? config.exp.android?.adaptiveIcon?.foregroundImage : undefined,
        isAndroid ? config.exp.android?.adaptiveIcon?.backgroundImage : undefined,
        config.exp.notification?.icon,
        // splash images
        config.exp.splash?.image,
        isAndroid ? config.exp.android?.splash?.image : undefined,
        isAndroid ? config.exp.android?.splash?.mdpi : undefined,
        isAndroid ? config.exp.android?.splash?.hdpi : undefined,
        isAndroid ? config.exp.android?.splash?.xhdpi : undefined,
        isAndroid ? config.exp.android?.splash?.xxhdpi : undefined,
        isAndroid ? config.exp.android?.splash?.xxxhdpi : undefined,
        isIos ? config.exp.ios?.splash?.image : undefined,
        isIos ? config.exp.ios?.splash?.tabletImage : undefined,
        // google service files
        isAndroid ? config.exp.android?.googleServicesFile : undefined,
        isIos ? config.exp.ios?.googleServicesFile : undefined,
    ].filter(Boolean);
    const externalFileSources = (await Promise.all(externalFiles.map(async (file) => {
        const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, file, 'expoConfigExternalFile');
        if (result != null) {
            debug(`Adding config external file - ${chalk_1.default.dim(file)}`);
        }
        return result;
    }))).filter(Boolean);
    results.push(...externalFileSources);
    // config plugins
    const configPluginSources = await getConfigPluginSourcesAsync(projectRoot, config.exp.plugins);
    results.push(...configPluginSources);
    return results;
}
exports.getExpoConfigSourcesAsync = getExpoConfigSourcesAsync;
function normalizeExpoConfig(config) {
    // Deep clone by JSON.parse/stringify that assumes the config is serializable.
    const normalizedConfig = JSON.parse(JSON.stringify(config));
    delete normalizedConfig.runtimeVersion;
    delete normalizedConfig._internal;
    return (0, Utils_1.stringifyJsonSorted)(normalizedConfig);
}
async function getConfigPluginSourcesAsync(projectRoot, plugins) {
    return (await Promise.all((plugins ?? []).map((plugin) => resolveConfigPluginSourceAsync(projectRoot, plugin)))).flat();
}
async function resolveConfigPluginSourceAsync(projectRoot, plugin) {
    const pluginPackageName = Array.isArray(plugin) ? plugin[0] : plugin;
    if (!pluginPackageName) {
        return [];
    }
    const modulePath = resolve_from_1.default.silent(projectRoot, pluginPackageName);
    if (!modulePath) {
        debug(`Cannot resolve static config-plugin: ${pluginPackageName}`);
        return [];
    }
    // Try to resolve the plugin as a node package
    if ((0, validate_npm_package_name_1.default)(pluginPackageName).validForNewPackages) {
        const nodePackageRoot = path_1.default.dirname(modulePath);
        debug(`Adding config-plugin node package root - ${chalk_1.default.dim(nodePackageRoot)}`);
        return [
            {
                type: 'dir',
                filePath: path_1.default.relative(projectRoot, nodePackageRoot),
                reasons: ['expoConfigPlugin:nodePackage'],
            },
        ];
    }
    // Try to resolve the plugin as a local config-plugin
    const reasons = ['expoConfigPlugin:local'];
    const localPluginPath = path_1.default.relative(projectRoot, (0, findDependencies_1.getAbsoluteModulePath)(projectRoot, modulePath));
    debug(`Adding local config-plugin file - ${chalk_1.default.dim(localPluginPath)}`);
    const results = [
        {
            type: 'file',
            filePath: localPluginPath,
            reasons,
        },
    ];
    try {
        const localDependencies = await (0, Profile_1.profile)(findDependencies_1.findLocalDependenciesFromFileRecursiveAsync, `findLocalDependenciesFromFileRecursiveAsync(${localPluginPath})`)(projectRoot, localPluginPath);
        results.push(...localDependencies.map((dep) => {
            debug(`Adding local config-plugin dependency file - ${chalk_1.default.dim(dep)}`);
            return {
                type: 'file',
                filePath: dep,
                reasons,
            };
        }));
    }
    catch (e) {
        debug('Error resolving local dependencies from local config-plugins', e);
    }
    return results;
}
async function getEasBuildSourcesAsync(projectRoot, options) {
    const files = ['eas.json', '.easignore'];
    const results = (await Promise.all(files.map(async (file) => {
        const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, file, 'easBuild');
        if (result != null) {
            debug(`Adding eas file - ${chalk_1.default.dim(file)}`);
        }
        return result;
    }))).filter(Boolean);
    return results;
}
exports.getEasBuildSourcesAsync = getEasBuildSourcesAsync;
async function getExpoAutolinkingAndroidSourcesAsync(projectRoot, options) {
    if (!options.platforms.includes('android')) {
        return [];
    }
    try {
        const reasons = ['expoAutolinkingAndroid'];
        const results = [];
        const { stdout } = await (0, spawn_async_1.default)('npx', ['expo-modules-autolinking', 'resolve', '-p', 'android', '--json'], { cwd: projectRoot });
        const config = sortExpoAutolinkingAndroidConfig(JSON.parse(stdout));
        for (const module of config.modules) {
            for (const project of module.projects) {
                const filePath = path_1.default.relative(projectRoot, project.sourceDir);
                project.sourceDir = filePath; // use relative path for the dir
                debug(`Adding expo-modules-autolinking android dir - ${chalk_1.default.dim(filePath)}`);
                results.push({ type: 'dir', filePath, reasons });
            }
        }
        results.push({
            type: 'contents',
            id: 'expoAutolinkingConfig:android',
            contents: JSON.stringify(config),
            reasons,
        });
        return results;
    }
    catch {
        return [];
    }
}
exports.getExpoAutolinkingAndroidSourcesAsync = getExpoAutolinkingAndroidSourcesAsync;
async function getExpoAutolinkingIosSourcesAsync(projectRoot, options) {
    if (!options.platforms.includes('ios')) {
        return [];
    }
    try {
        const reasons = ['expoAutolinkingIos'];
        const results = [];
        const { stdout } = await (0, spawn_async_1.default)('npx', ['expo-modules-autolinking', 'resolve', '-p', 'ios', '--json'], { cwd: projectRoot });
        const config = JSON.parse(stdout);
        for (const module of config.modules) {
            for (const pod of module.pods) {
                const filePath = path_1.default.relative(projectRoot, pod.podspecDir);
                pod.podspecDir = filePath; // use relative path for the dir
                debug(`Adding expo-modules-autolinking ios dir - ${chalk_1.default.dim(filePath)}`);
                results.push({ type: 'dir', filePath, reasons });
            }
        }
        results.push({
            type: 'contents',
            id: 'expoAutolinkingConfig:ios',
            contents: JSON.stringify(config),
            reasons,
        });
        return results;
    }
    catch {
        return [];
    }
}
exports.getExpoAutolinkingIosSourcesAsync = getExpoAutolinkingIosSourcesAsync;
/**
 * Sort the expo-modules-autolinking android config to make it stable from hashing.
 */
function sortExpoAutolinkingAndroidConfig(config) {
    for (const module of config.modules) {
        // Sort the projects by project.name
        module.projects.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    }
    return config;
}
exports.sortExpoAutolinkingAndroidConfig = sortExpoAutolinkingAndroidConfig;
//# sourceMappingURL=Expo.js.map