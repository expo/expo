"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._resolveReactNativeModule = _resolveReactNativeModule;
exports.createReactNativeConfigAsync = createReactNativeConfigAsync;
exports.resolveAppProjectConfigAsync = resolveAppProjectConfigAsync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const androidResolver_1 = require("./androidResolver");
const config_1 = require("./config");
const iosResolver_1 = require("./iosResolver");
const autolinking_1 = require("../autolinking");
const dependencies_1 = require("../dependencies");
async function _resolveReactNativeModule(resolution, projectConfig, platform) {
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
    let platformData = null;
    if (platform === 'android') {
        platformData = await (0, androidResolver_1.resolveDependencyConfigImplAndroidAsync)(resolution.path, reactNativeConfig.platforms?.android);
    }
    else if (platform === 'ios') {
        platformData = await (0, iosResolver_1.resolveDependencyConfigImplIosAsync)(resolution, reactNativeConfig.platforms?.ios);
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
async function createReactNativeConfigAsync(providedOptions) {
    const options = await (0, autolinking_1.mergeLinkingOptionsAsync)(providedOptions);
    const projectConfig = await (0, config_1.loadConfigAsync)(options.projectRoot);
    // custom native modules should be resolved first so that they can override other modules
    const searchPaths = options.nativeModulesDir && fs_1.default.existsSync(options.nativeModulesDir)
        ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
        : (options.searchPaths ?? []);
    const resolutions = (0, dependencies_1.mergeResolutionResults)(await Promise.all([
        (0, dependencies_1.scanDependenciesFromRNProjectConfig)(options.projectRoot, projectConfig),
        ...searchPaths.map((searchPath) => (0, dependencies_1.scanDependenciesInSearchPath)(searchPath)),
        (0, dependencies_1.scanDependenciesRecursively)(options.projectRoot),
    ]));
    const dependencies = await (0, dependencies_1.filterMapResolutionResult)(resolutions, (resolution) => _resolveReactNativeModule(resolution, projectConfig, options.platform));
    return {
        root: options.projectRoot,
        reactNativePath: resolutions['react-native']?.path,
        dependencies,
        project: await resolveAppProjectConfigAsync(options.projectRoot, options.platform, options.sourceDir),
    };
}
async function resolveAppProjectConfigAsync(projectRoot, platform, sourceDir) {
    if (platform === 'android') {
        const androidDir = path_1.default.join(projectRoot, 'android');
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