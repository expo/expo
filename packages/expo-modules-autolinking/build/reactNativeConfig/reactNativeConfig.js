"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReactNativeModule = resolveReactNativeModule;
exports.createReactNativeConfigAsync = createReactNativeConfigAsync;
exports.resolveAppProjectConfigAsync = resolveAppProjectConfigAsync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const androidResolver_1 = require("./androidResolver");
const config_1 = require("./config");
const iosResolver_1 = require("./iosResolver");
const ExpoModuleConfig_1 = require("../ExpoModuleConfig");
const dependencies_1 = require("../dependencies");
const webResolver_1 = require("./webResolver");
const platforms_1 = require("../platforms");
const deepObjectMerge = (target, source) => {
    if (source !== undefined &&
        typeof target === 'object' &&
        target != null &&
        !Array.isArray(target) &&
        (!target.constructor || target.constructor === Object) &&
        typeof source === 'object' &&
        !Array.isArray(source)) {
        target = { ...target };
        for (const key in source) {
            target[key] = deepObjectMerge(target[key], source[key]);
        }
        return target;
    }
    return source !== undefined ? source : target;
};
const isMissingFBReactNativeSpecCodegenOutput = async (reactNativePath) => {
    const generatedDir = path_1.default.resolve(reactNativePath, 'React/FBReactNativeSpec');
    try {
        const stat = await fs_1.default.promises.lstat(generatedDir);
        return !stat.isDirectory();
    }
    catch {
        return true;
    }
};
async function resolveReactNativeModule(resolution, projectConfig, platform, excludeNames) {
    // The platform's support package is the react-native host (e.g. react-native-macos for macos,
    // react-native-tvos for tvos), not a linkable module — filter it out alongside react-native.
    // This is null for platforms without a host (web, apple), so only react-native is filtered.
    const supportPackage = (0, platforms_1.getSupportPackageForPlatform)(platform);
    if (excludeNames.has(resolution.name)) {
        return null;
    }
    else if (resolution.name === 'react-native' || resolution.name === supportPackage) {
        // Starting from version 0.76, the `react-native` package only defines platforms
        // when @react-native-community/cli-platform-android/ios is installed.
        // Therefore, we need to manually filter it (and the platform's support package) out.
        // NOTE(@kitten): `loadConfigAsync` is skipped too, because react-native's config is too slow
        return null;
    }
    // Workaround for Android Gradle/Prefab issue with special characters in paths.
    // pnpm creates virtual store paths with '=' characters (e.g., _patch_hash=abc123),
    // which cause build failures on Android due to Prefab not properly escaping them.
    // See: https://github.com/google/prefab/issues/187
    const shouldUseOriginPath = platform === 'android' && resolution.path.includes('=') && resolution.path.includes('.pnpm');
    const modulePath = shouldUseOriginPath ? resolution.originPath : resolution.path;
    const libraryConfig = (await (0, config_1.loadConfigAsync)(modulePath));
    if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
        // Package defines platforms would be a platform host package.
        // The rnc-cli will skip this package.
        return null;
    }
    let reactNativeConfig = libraryConfig?.dependency ?? {};
    const projectDependencyOverride = projectConfig?.dependencies?.[resolution.name];
    if (projectDependencyOverride != null) {
        reactNativeConfig = deepObjectMerge(reactNativeConfig, projectDependencyOverride);
    }
    let maybeExpoModuleConfig;
    if (!libraryConfig) {
        // NOTE(@kitten): If we don't have an explicit react-native.config.{js,ts} file,
        // we should pass the Expo Module config (if it exists) to the resolvers below,
        // which can then decide if the React Native inferred config and Expo Module
        // configs conflict
        try {
            maybeExpoModuleConfig = await (0, ExpoModuleConfig_1.discoverExpoModuleConfigAsync)(resolution.path);
        }
        catch {
            // We ignore invalid Expo Modules for the purpose of auto-linking and
            // pretend the config doesn't exist, if it isn't valid JSON
        }
    }
    let platformData = null;
    if (platform === 'android') {
        platformData = await (0, androidResolver_1.resolveDependencyConfigImplAndroidAsync)(modulePath, reactNativeConfig.platforms?.android, maybeExpoModuleConfig);
    }
    else if (platform === 'ios') {
        platformData = await (0, iosResolver_1.resolveDependencyConfigImplIosAsync)(resolution, reactNativeConfig.platforms?.ios, maybeExpoModuleConfig);
    }
    else if (platform === 'tvos' || platform === 'macos') {
        // tvos/macos build through the Apple toolchain, so they reuse the iOS autolinking resolver.
        // Use the platform-specific `react-native.config` entry when it's set — including an explicit
        // `null`, which disables autolinking for that platform — and only fall back to `platforms.ios`
        // when it's unset (`undefined`). Results are reported under the platform's own key.
        const platformConfig = reactNativeConfig.platforms?.[platform];
        const appleConfig = platformConfig !== undefined ? platformConfig : reactNativeConfig.platforms?.ios;
        platformData = await (0, iosResolver_1.resolveDependencyConfigImplIosAsync)(resolution, appleConfig, maybeExpoModuleConfig);
    }
    else if (platform === 'web') {
        platformData = await (0, webResolver_1.checkDependencyWebAsync)(resolution, reactNativeConfig, maybeExpoModuleConfig);
    }
    return (platformData && {
        root: modulePath,
        name: resolution.name,
        platforms: {
            [platform]: platformData,
        },
    });
}
/**
 * Create config for react-native core autolinking.
 */
async function createReactNativeConfigAsync({ appRoot, sourceDir, autolinkingOptions, }) {
    const excludeNames = new Set(autolinkingOptions.exclude);
    const projectConfig = (await (0, config_1.loadConfigAsync)(appRoot));
    // custom native modules should be resolved first so that they can override other modules
    const searchPaths = autolinkingOptions.nativeModulesDir
        ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
        : autolinkingOptions.searchPaths;
    const limitDepth = autolinkingOptions.legacy_shallowReactNativeLinking ? 1 : undefined;
    const resolutions = (0, dependencies_1.mergeResolutionResults)(await Promise.all([
        (0, dependencies_1.scanDependenciesFromRNProjectConfig)(appRoot, projectConfig),
        ...searchPaths.map((searchPath) => (0, dependencies_1.scanDependenciesInSearchPath)(searchPath)),
        (0, dependencies_1.scanDependenciesRecursively)(appRoot, { limitDepth }),
    ]));
    const dependencies = await (0, dependencies_1.filterMapResolutionResult)(resolutions, (resolution) => resolveReactNativeModule(resolution, projectConfig, autolinkingOptions.platform, excludeNames));
    // The support package is the platform's react-native host (react-native for ios/android,
    // react-native-tvos / react-native-macos for the out-of-tree platforms). This replaces the
    // npm-alias approach where the support package was installed under the `react-native` name.
    // Native platforms always resolve a host package; fall back to react-native for safety.
    const supportPackage = (0, platforms_1.getSupportPackageForPlatform)(autolinkingOptions.platform) ?? 'react-native';
    // See: https://github.com/facebook/react-native/pull/53690
    // When we're building react-native from source without these generated files, we need to force them to be generated
    // Every published react-native version (or out-of-tree version) should have these files, but building from the raw repo won't (e.g. Expo Go)
    const reactNativeResolution = resolutions[supportPackage];
    if (reactNativeResolution &&
        autolinkingOptions.platform === 'ios' &&
        (await isMissingFBReactNativeSpecCodegenOutput(reactNativeResolution.path))) {
        dependencies['react-native'] = {
            root: reactNativeResolution.path,
            name: 'react-native',
            platforms: {
                ios: {
                    // This will trigger a warning in list_native_modules but will trigger the artifacts
                    // codegen codepath as expected
                    podspecPath: '',
                    version: reactNativeResolution.version,
                    configurations: [],
                    scriptPhases: [],
                },
            },
        };
    }
    const reactNativePath = resolutions[supportPackage]?.path;
    return {
        root: appRoot,
        reactNativePath,
        dependencies,
        project: await resolveAppProjectConfigAsync(appRoot, autolinkingOptions.platform, sourceDir),
    };
}
function resolveAppleProjectSourceDir(projectRoot, platform) {
    const platformDir = path_1.default.join(projectRoot, platform);
    if (fs_1.default.existsSync(path_1.default.join(platformDir, 'Podfile'))) {
        return platformDir;
    }
    return path_1.default.join(projectRoot, 'ios');
}
async function resolveAppProjectConfigAsync(projectRoot, platform, sourceDir) {
    // TODO(@kitten): use the commandRoot here to find these files in non <projectRoot>/<platform> folders
    if (platform === 'android') {
        const androidDir = sourceDir ?? path_1.default.join(projectRoot, 'android');
        const { gradle, manifest } = await (0, androidResolver_1.findGradleAndManifestAsync)({ androidDir, isLibrary: false });
        if (gradle == null || manifest == null) {
            return {};
        }
        const packageName = await (0, androidResolver_1.parsePackageNameAsync)(manifest, gradle);
        return {
            android: {
                packageName: packageName ?? '',
                sourceDir: sourceDir ?? path_1.default.join(projectRoot, 'android'),
            },
        };
    }
    if (platform === 'ios' || platform === 'tvos' || platform === 'macos') {
        // tvos/macos may reuse the iOS (Apple) toolchain but are reported under their own platform key
        return {
            [platform]: {
                sourceDir: sourceDir ?? resolveAppleProjectSourceDir(projectRoot, platform),
            },
        };
    }
    return {};
}
//# sourceMappingURL=reactNativeConfig.js.map