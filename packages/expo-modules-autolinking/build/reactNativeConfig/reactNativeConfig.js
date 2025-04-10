"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReactNativeConfigAsync = createReactNativeConfigAsync;
exports.findDependencyRootsAsync = findDependencyRootsAsync;
exports.resolveDependencyConfigAsync = resolveDependencyConfigAsync;
exports.resolveEdgeToEdgeDependencyRoot = resolveEdgeToEdgeDependencyRoot;
exports.resolveAppProjectConfigAsync = resolveAppProjectConfigAsync;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const utils_1 = require("../autolinking/utils");
const fileUtils_1 = require("../fileUtils");
const androidResolver_1 = require("./androidResolver");
const config_1 = require("./config");
const iosResolver_1 = require("./iosResolver");
const android_1 = require("../platforms/android");
const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'expo.edgeToEdgeEnabled';
/**
 * Create config for react-native core autolinking.
 */
async function createReactNativeConfigAsync({ platform, projectRoot, searchPaths, }) {
    const projectConfig = await (0, config_1.loadConfigAsync)(projectRoot);
    const dependencyRoots = {
        ...(await findDependencyRootsAsync(projectRoot, searchPaths)),
        ...findProjectLocalDependencyRoots(projectConfig),
    };
    // For Expo SDK 53 onwards, `react-native-edge-to-edge` is a transitive dependency of every expo project. Unless the user
    // has also included it as a project dependency, we have to autolink it manually (transitive non-expo module dependencies are not autolinked).
    // There are two reasons why we don't want to autolink `edge-to-edge` when `edgeToEdge` property is set to `false`:
    // 1. `react-native-is-edge-to-edge` tries to check if the `edge-to-edge` turbomodule is present to determine whether edge-to-edge is enabled.
    // 2. `react-native-edge-to-edge` applies edge-to-edge in `onHostResume` and has no property to disable this behavior.
    const shouldAutolinkEdgeToEdge = platform === 'android' &&
        (await resolveGradleEdgeToEdgeEnabled(projectRoot)) &&
        !('react-native-edge-to-edge' in dependencyRoots);
    if (shouldAutolinkEdgeToEdge) {
        const edgeToEdgeRoot = resolveEdgeToEdgeDependencyRoot(projectRoot);
        if (edgeToEdgeRoot) {
            dependencyRoots['react-native-edge-to-edge'] = edgeToEdgeRoot;
        }
    }
    // NOTE(@kitten): If this isn't resolved to be the realpath and is a symlink,
    // the Cocoapods resolution will detect path mismatches and generate nonsensical
    // relative paths that won't resolve
    let reactNativePath;
    try {
        reactNativePath = await promises_1.default.realpath(dependencyRoots['react-native']);
    }
    catch {
        reactNativePath = dependencyRoots['react-native'];
    }
    const dependencyConfigs = await Promise.all(Object.entries(dependencyRoots).map(async ([name, packageRoot]) => {
        const config = await resolveDependencyConfigAsync(platform, name, packageRoot, projectConfig);
        return [name, config];
    }));
    const dependencyResults = Object.fromEntries(dependencyConfigs.filter(([, config]) => config != null));
    const projectData = await resolveAppProjectConfigAsync(projectRoot, platform);
    return {
        root: projectRoot,
        reactNativePath,
        dependencies: dependencyResults,
        project: projectData,
    };
}
/**
 * Find all dependencies and their directories from the project.
 */
async function findDependencyRootsAsync(projectRoot, searchPaths) {
    const packageJson = JSON.parse(await promises_1.default.readFile(path_1.default.join(projectRoot, 'package.json'), 'utf8'));
    const dependencies = [
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.devDependencies ?? {}),
    ];
    const results = {};
    // `searchPathSet` can be mutated to discover all "isolated modules groups", when using isolated modules
    const searchPathSet = new Set(searchPaths);
    for (const name of dependencies) {
        for (const searchPath of searchPathSet) {
            const packageConfigPath = path_1.default.resolve(searchPath, name, 'package.json');
            if (await (0, fileUtils_1.fileExistsAsync)(packageConfigPath)) {
                const packageRoot = path_1.default.dirname(packageConfigPath);
                results[name] = packageRoot;
                const maybeIsolatedModulesPath = (0, utils_1.getIsolatedModulesPath)(packageRoot, name);
                if (maybeIsolatedModulesPath) {
                    searchPathSet.add(maybeIsolatedModulesPath);
                }
                break;
            }
        }
    }
    return results;
}
/**
 * Find local dependencies that specified in the `react-native.config.js` file.
 */
function findProjectLocalDependencyRoots(projectConfig) {
    if (!projectConfig?.dependencies) {
        return {};
    }
    const results = {};
    for (const [name, config] of Object.entries(projectConfig.dependencies)) {
        if (typeof config.root === 'string') {
            results[name] = config.root;
        }
    }
    return results;
}
async function resolveDependencyConfigAsync(platform, name, packageRoot, projectConfig) {
    const libraryConfig = await (0, config_1.loadConfigAsync)(packageRoot);
    const reactNativeConfig = {
        ...libraryConfig?.dependency,
        ...projectConfig?.dependencies?.[name],
    };
    if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
        // Package defines platforms would be a platform host package.
        // The rnc-cli will skip this package.
        return null;
    }
    if (name === 'react-native' || name === 'react-native-macos') {
        // Starting from version 0.76, the `react-native` package only defines platforms
        // when @react-native-community/cli-platform-android/ios is installed.
        // Therefore, we need to manually filter it out.
        return null;
    }
    let platformData = null;
    if (platform === 'android') {
        platformData = await (0, androidResolver_1.resolveDependencyConfigImplAndroidAsync)(packageRoot, reactNativeConfig.platforms?.android);
    }
    else if (platform === 'ios') {
        platformData = await (0, iosResolver_1.resolveDependencyConfigImplIosAsync)(packageRoot, reactNativeConfig.platforms?.ios);
    }
    if (!platformData) {
        return null;
    }
    return {
        root: packageRoot,
        name,
        platforms: {
            [platform]: platformData,
        },
    };
}
function resolveEdgeToEdgeDependencyRoot(projectRoot) {
    const expoPackageRoot = resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    const edgeToEdgePath = resolve_from_1.default.silent(expoPackageRoot ?? projectRoot, 'react-native-edge-to-edge/package.json');
    if (edgeToEdgePath) {
        return path_1.default.dirname(edgeToEdgePath);
    }
    return null;
}
async function resolveAppProjectConfigAsync(projectRoot, platform) {
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
                sourceDir: path_1.default.join(projectRoot, 'android'),
            },
        };
    }
    if (platform === 'ios') {
        return {
            ios: {
                sourceDir: path_1.default.join(projectRoot, 'ios'),
            },
        };
    }
    return {};
}
/**
 * Resolve the `expo.edgeToEdgeEnabled` property from the `gradle.properties` file.
 */
async function resolveGradleEdgeToEdgeEnabled(projectRoot) {
    return ((await (0, android_1.resolveGradlePropertyAsync)(path_1.default.join(projectRoot, 'android'), EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY)) === 'true');
}
//# sourceMappingURL=reactNativeConfig.js.map