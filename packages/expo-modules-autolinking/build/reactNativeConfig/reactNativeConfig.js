"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAppProjectConfigAsync = exports.resolveDependencyConfigAsync = exports.findDependencyRootsAsync = exports.createReactNativeConfigAsync = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../autolinking/utils");
const fileUtils_1 = require("../fileUtils");
const androidResolver_1 = require("./androidResolver");
const config_1 = require("./config");
const iosResolver_1 = require("./iosResolver");
/**
 * Create config for react-native core autolinking.
 */
async function createReactNativeConfigAsync({ platform, projectRoot, searchPaths, }) {
    const projectConfig = await (0, config_1.loadConfigAsync)(projectRoot);
    const dependencyRoots = {
        ...(await findDependencyRootsAsync(projectRoot, searchPaths)),
        ...findProjectLocalDependencyRoots(projectConfig),
    };
    const reactNativePath = dependencyRoots['react-native'];
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
exports.createReactNativeConfigAsync = createReactNativeConfigAsync;
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
exports.findDependencyRootsAsync = findDependencyRootsAsync;
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
    if (name === 'react-native') {
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
exports.resolveDependencyConfigAsync = resolveDependencyConfigAsync;
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
exports.resolveAppProjectConfigAsync = resolveAppProjectConfigAsync;
//# sourceMappingURL=reactNativeConfig.js.map