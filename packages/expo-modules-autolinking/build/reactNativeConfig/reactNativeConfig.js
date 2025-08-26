"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReactNativeModule = resolveReactNativeModule;
exports.createReactNativeConfigAsync = createReactNativeConfigAsync;
exports.resolveAppProjectConfigAsync = resolveAppProjectConfigAsync;
const path_1 = __importDefault(require("path"));
const androidResolver_1 = require("./androidResolver");
const config_1 = require("./config");
const iosResolver_1 = require("./iosResolver");
const ExpoModuleConfig_1 = require("../ExpoModuleConfig");
const dependencies_1 = require("../dependencies");
async function resolveReactNativeModule(resolution, projectConfig, platform, excludeNames) {
    if (excludeNames.has(resolution.name)) {
        return null;
    }
    const libraryConfig = await (0, config_1.loadConfigAsync)(resolution.path);
    const reactNativeConfig = {
        ...libraryConfig?.dependency,
        ...projectConfig?.dependencies?.[resolution.name],
    };
    if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
        // Package defines platforms would be a platform host package.
        // The rnc-cli will skip this package.
        return null;
    }
    else if (resolution.name === 'react-native' || resolution.name === 'react-native-macos') {
        // Starting from version 0.76, the `react-native` package only defines platforms
        // when @react-native-community/cli-platform-android/ios is installed.
        // Therefore, we need to manually filter it out.
        return null;
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
        platformData = await (0, androidResolver_1.resolveDependencyConfigImplAndroidAsync)(resolution.path, reactNativeConfig.platforms?.android, maybeExpoModuleConfig);
    }
    else if (platform === 'ios') {
        platformData = await (0, iosResolver_1.resolveDependencyConfigImplIosAsync)(resolution, reactNativeConfig.platforms?.ios, maybeExpoModuleConfig);
    }
    return (platformData && {
        root: resolution.path,
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
    const projectConfig = await (0, config_1.loadConfigAsync)(appRoot);
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
    return {
        root: appRoot,
        reactNativePath: resolutions['react-native']?.path,
        dependencies,
        project: await resolveAppProjectConfigAsync(appRoot, autolinkingOptions.platform, sourceDir),
    };
}
async function resolveAppProjectConfigAsync(projectRoot, platform, sourceDir) {
    // TODO(@kitten): use the commandRoot here to find these files in non <projectRoot>/<platform> folders
    if (platform === 'android') {
        const androidDir = sourceDir ?? path_1.default.join(projectRoot, 'android');
        const { gradle, manifest } = await (0, androidResolver_1.findGradleAndManifestAsync)({ androidDir, isLibrary: false });
        if (gradle == null || manifest == null) {
            return {};
        }
        const packageName = await (0, androidResolver_1.parsePackageNameAsync)(androidDir, manifest, gradle);
        return {
            android: {
                packageName: packageName ?? '',
                sourceDir: sourceDir ?? path_1.default.join(projectRoot, 'android'),
            },
        };
    }
    if (platform === 'ios') {
        return {
            ios: {
                sourceDir: sourceDir ?? path_1.default.join(projectRoot, 'ios'),
            },
        };
    }
    return {};
}
//# sourceMappingURL=reactNativeConfig.js.map