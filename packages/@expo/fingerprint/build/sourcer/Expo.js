"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoConfigSourcesAsync = getExpoConfigSourcesAsync;
exports.createHashSourceExternalFileAsync = createHashSourceExternalFileAsync;
exports.getEasBuildSourcesAsync = getEasBuildSourcesAsync;
exports.getExpoAutolinkingAndroidSourcesAsync = getExpoAutolinkingAndroidSourcesAsync;
exports.getExpoCNGPatchSourcesAsync = getExpoCNGPatchSourcesAsync;
exports.getExpoAutolinkingIosSourcesAsync = getExpoAutolinkingIosSourcesAsync;
exports.sortExpoAutolinkingAndroidConfig = sortExpoAutolinkingAndroidConfig;
exports.getConfigPluginProps = getConfigPluginProps;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const ExpoResolver_1 = require("../ExpoResolver");
const SourceSkips_1 = require("./SourceSkips");
const Utils_1 = require("./Utils");
const Path_1 = require("../utils/Path");
const debug = require('debug')('expo:fingerprint:sourcer:Expo');
async function getExpoConfigSourcesAsync(projectRoot, config, loadedModules, options) {
    if (options.sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigAll) {
        return [];
    }
    if (config == null) {
        return [];
    }
    const results = [];
    let expoConfig = normalizeExpoConfig(config.exp, projectRoot, options);
    // external files in config
    const isAndroid = options.platforms.includes('android');
    const isIos = options.platforms.includes('ios');
    const splashScreenPluginProps = getConfigPluginProps(expoConfig, 'expo-splash-screen');
    const externalFiles = [
        // icons
        expoConfig.icon,
        isAndroid ? expoConfig.android?.icon : undefined,
        ...(isIos ? collectIosIcons(expoConfig.ios?.icon) : []),
        isAndroid ? expoConfig.android?.adaptiveIcon?.foregroundImage : undefined,
        isAndroid ? expoConfig.android?.adaptiveIcon?.backgroundImage : undefined,
        expoConfig.notification?.icon,
        // expo-splash-screen images
        splashScreenPluginProps?.image,
        splashScreenPluginProps?.dark?.image,
        isAndroid ? splashScreenPluginProps?.android?.image : undefined,
        isAndroid ? splashScreenPluginProps?.android?.mdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.hdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.xhdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.xxhdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.xxxhdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.dark?.image : undefined,
        isAndroid ? splashScreenPluginProps?.android?.dark?.mdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.dark?.hdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.dark?.xhdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.dark?.xxhdpi : undefined,
        isAndroid ? splashScreenPluginProps?.android?.dark?.xxxhdpi : undefined,
        isIos ? splashScreenPluginProps?.ios?.image : undefined,
        isIos ? splashScreenPluginProps?.ios?.tabletImage : undefined,
        isIos ? splashScreenPluginProps?.ios?.dark?.image : undefined,
        isIos ? splashScreenPluginProps?.ios?.dark?.tabletImage : undefined,
        // legacy splash images
        expoConfig.splash?.image,
        isAndroid ? expoConfig.android?.splash?.image : undefined,
        isAndroid ? expoConfig.android?.splash?.mdpi : undefined,
        isAndroid ? expoConfig.android?.splash?.hdpi : undefined,
        isAndroid ? expoConfig.android?.splash?.xhdpi : undefined,
        isAndroid ? expoConfig.android?.splash?.xxhdpi : undefined,
        isAndroid ? expoConfig.android?.splash?.xxxhdpi : undefined,
        isIos ? expoConfig.ios?.splash?.image : undefined,
        isIos ? expoConfig.ios?.splash?.tabletImage : undefined,
        // google service files
        isAndroid ? expoConfig.android?.googleServicesFile : undefined,
        isIos ? expoConfig.ios?.googleServicesFile : undefined,
    ]
        .filter((file) => Boolean(file))
        .map((filePath) => ensureRelativePath(projectRoot, filePath));
    const externalFileSources = (await Promise.all(externalFiles.map((file) => createHashSourceExternalFileAsync({ projectRoot, file, reason: 'expoConfigExternalFile' })))).filter(Boolean);
    results.push(...externalFileSources);
    expoConfig = postUpdateExpoConfig(expoConfig, projectRoot);
    results.push({
        type: 'contents',
        id: 'expoConfig',
        contents: (0, Utils_1.stringifyJsonSorted)(expoConfig),
        reasons: ['expoConfig'],
    });
    // config plugins
    const configPluginModules = (loadedModules ?? []).map((modulePath) => ({
        type: 'file',
        filePath: (0, Path_1.toPosixPath)(modulePath),
        reasons: ['expoConfigPlugins'],
    }));
    results.push(...configPluginModules);
    return results;
}
function normalizeExpoConfig(config, projectRoot, options) {
    // Deep clone by JSON.parse/stringify that assumes the config is serializable.
    const normalizedConfig = JSON.parse(JSON.stringify(config));
    const { sourceSkips } = options;
    delete normalizedConfig._internal;
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigVersions) {
        delete normalizedConfig.version;
        delete normalizedConfig.android?.versionCode;
        delete normalizedConfig.ios?.buildNumber;
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigRuntimeVersionIfString) {
        if (typeof normalizedConfig.runtimeVersion === 'string') {
            delete normalizedConfig.runtimeVersion;
        }
        if (typeof normalizedConfig.android?.runtimeVersion === 'string') {
            delete normalizedConfig.android.runtimeVersion;
        }
        if (typeof normalizedConfig.ios?.runtimeVersion === 'string') {
            delete normalizedConfig.ios.runtimeVersion;
        }
        if (typeof normalizedConfig.web?.runtimeVersion === 'string') {
            delete normalizedConfig.web.runtimeVersion;
        }
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigNames) {
        normalizedConfig.name = '';
        delete normalizedConfig.description;
        delete normalizedConfig.web?.name;
        delete normalizedConfig.web?.shortName;
        delete normalizedConfig.web?.description;
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigAndroidPackage) {
        delete normalizedConfig.android?.package;
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigIosBundleIdentifier) {
        delete normalizedConfig.ios?.bundleIdentifier;
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigSchemes) {
        delete normalizedConfig.scheme;
        normalizedConfig.slug = '';
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigEASProject) {
        delete normalizedConfig.owner;
        delete normalizedConfig?.extra?.eas;
        delete normalizedConfig?.updates?.url;
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigAssets) {
        delete normalizedConfig.icon;
        delete normalizedConfig.splash;
        delete normalizedConfig.android?.adaptiveIcon;
        delete normalizedConfig.android?.icon;
        delete normalizedConfig.android?.splash;
        delete normalizedConfig.ios?.icon;
        delete normalizedConfig.ios?.splash;
        delete normalizedConfig.web?.favicon;
        delete normalizedConfig.web?.splash;
    }
    if (sourceSkips & SourceSkips_1.SourceSkips.ExpoConfigExtraSection) {
        delete normalizedConfig.extra;
    }
    return (0, Utils_1.relativizeJsonPaths)(normalizedConfig, projectRoot);
}
/**
 * Gives the last chance to modify the ExpoConfig.
 * For example, we can remove some fields that are already included in the fingerprint.
 */
function postUpdateExpoConfig(config, projectRoot) {
    // The config is already a clone, so we can modify it in place for performance.
    // googleServicesFile may contain absolute paths on EAS with file-based secrets.
    // Given we include googleServicesFile as external files already, we can remove it from the config.
    delete config.android?.googleServicesFile;
    delete config.ios?.googleServicesFile;
    return config;
}
/**
 * Collect iOS icon to flattened file paths.
 */
function collectIosIcons(icon) {
    if (icon == null) {
        return [];
    }
    if (typeof icon === 'string') {
        return [icon];
    }
    return [icon.light, icon.dark, icon.tinted].filter((file) => Boolean(file));
}
/**
 * The filePath in config could be relative (`./assets/icon.png`, `assets/icon.png`) or even absolute.
 * We need to normalize the path and return as relative path without `./` prefix.
 */
function ensureRelativePath(projectRoot, filePath) {
    const absolutePath = path_1.default.resolve(projectRoot, filePath);
    return path_1.default.relative(projectRoot, absolutePath);
}
async function createHashSourceExternalFileAsync({ projectRoot, file, reason, }) {
    const hashSource = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, file, reason);
    if (hashSource) {
        debug(`Adding config external file - ${chalk_1.default.dim(file)}`);
        if (hashSource.type === 'file' || hashSource.type === 'dir') {
            // We include the expo config contents in the fingerprint,
            // the `filePath` hashing for the external files is not necessary.
            // Especially people using EAS environment variables for the google service files,
            // the `filePath` will be different between local and remote builds.
            // We use a fixed override hash key and basically ignore the `filePath` hashing.
            hashSource.overrideHashKey = 'expoConfigExternalFile:contentsOnly';
        }
    }
    return hashSource;
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
async function getExpoAutolinkingAndroidSourcesAsync(projectRoot, options, expoAutolinkingVersion) {
    if (!options.platforms.includes('android')) {
        return [];
    }
    try {
        const reasons = ['expoAutolinkingAndroid'];
        const results = [];
        const { stdout } = await (0, spawn_async_1.default)('node', [(0, ExpoResolver_1.resolveExpoAutolinkingCliPath)(projectRoot), 'resolve', '-p', 'android', '--json'], { cwd: projectRoot });
        const config = sortExpoAutolinkingAndroidConfig(JSON.parse(stdout));
        for (const module of config.modules) {
            for (const project of module.projects) {
                const filePath = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, project.sourceDir));
                project.sourceDir = filePath; // use relative path for the dir
                debug(`Adding expo-modules-autolinking android dir - ${chalk_1.default.dim(filePath)}`);
                results.push({ type: 'dir', filePath, reasons });
                // `aarProjects` is present in project starting from SDK 53+.
                if (project.aarProjects) {
                    for (const aarProject of project.aarProjects) {
                        // use relative path for aarProject fields
                        aarProject.aarFilePath = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, aarProject.aarFilePath));
                        aarProject.projectDir = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, aarProject.projectDir));
                    }
                }
                if (typeof project.shouldUsePublicationScriptPath === 'string') {
                    project.shouldUsePublicationScriptPath = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, project.shouldUsePublicationScriptPath));
                }
            }
            if (module.plugins) {
                for (const plugin of module.plugins) {
                    const filePath = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, plugin.sourceDir));
                    plugin.sourceDir = filePath; // use relative path for the dir
                    debug(`Adding expo-modules-autolinking android dir - ${chalk_1.default.dim(filePath)}`);
                    results.push({ type: 'dir', filePath, reasons });
                }
            }
            // Backward compatibility for SDK versions earlier than 53
            if (module.aarProjects) {
                for (const aarProject of module.aarProjects) {
                    // use relative path for aarProject fields
                    aarProject.aarFilePath = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, aarProject.aarFilePath));
                    aarProject.projectDir = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, aarProject.projectDir));
                }
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
/**
 * Gets the patch sources for the `patch-project`.
 */
async function getExpoCNGPatchSourcesAsync(projectRoot, options) {
    const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, 'cng-patches', 'expoCNGPatches');
    if (result != null) {
        debug(`Adding dir - ${chalk_1.default.dim('cng-patches')}`);
        return [result];
    }
    return [];
}
async function getExpoAutolinkingIosSourcesAsync(projectRoot, options, expoAutolinkingVersion) {
    if (!options.platforms.includes('ios')) {
        return [];
    }
    // expo-modules-autolinking 1.10.0 added support for apple platform
    const platform = semver_1.default.lt(expoAutolinkingVersion, '1.10.0') ? 'ios' : 'apple';
    try {
        const reasons = ['expoAutolinkingIos'];
        const results = [];
        const { stdout } = await (0, spawn_async_1.default)('node', [(0, ExpoResolver_1.resolveExpoAutolinkingCliPath)(projectRoot), 'resolve', '-p', platform, '--json'], { cwd: projectRoot });
        const config = JSON.parse(stdout);
        for (const module of config.modules) {
            for (const pod of module.pods) {
                const filePath = (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, pod.podspecDir));
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
/**
 * Get the props for a config-plugin
 */
function getConfigPluginProps(config, pluginName) {
    const plugin = (config.plugins ?? []).find((plugin) => {
        if (Array.isArray(plugin)) {
            return plugin[0] === pluginName;
        }
        return plugin === pluginName;
    });
    if (Array.isArray(plugin)) {
        return (plugin[1] ?? null);
    }
    return null;
}
//# sourceMappingURL=Expo.js.map