"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDependencyConfigAsync = exports.findDependencyRootsAsync = exports.createRncConfigCompatAsync = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const androidCompat_1 = require("./androidCompat");
const iosCompat_1 = require("./iosCompat");
const reactNativeConfig_1 = require("./reactNativeConfig");
const utils_1 = require("./utils");
const utils_2 = require("../autolinking/utils");
/**
 * Create @react-native-community/cli compatible config for autolinking.
 */
async function createRncConfigCompatAsync({ platform, projectRoot, searchPaths, }) {
    const projectConfig = await (0, reactNativeConfig_1.loadReactNativeConfigAsync)(projectRoot);
    const dependencyRoots = await findDependencyRootsAsync(projectRoot, searchPaths);
    const reactNativePath = dependencyRoots['react-native'];
    const dependencyConfigs = await Promise.all(Object.entries(dependencyRoots).map(async ([name, packageRoot]) => {
        const config = await resolveDependencyConfigAsync(platform, name, packageRoot, projectConfig);
        return [name, config];
    }));
    const dependencyResults = Object.fromEntries(dependencyConfigs.filter(([, config]) => config != null));
    const projectData = platform === 'ios' ? { ios: { sourceDir: path_1.default.join(projectRoot, 'ios') } } : {};
    return {
        root: projectRoot,
        reactNativePath,
        dependencies: dependencyResults,
        project: projectData,
    };
}
exports.createRncConfigCompatAsync = createRncConfigCompatAsync;
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
            if (await (0, utils_1.fileExistsAsync)(packageConfigPath)) {
                const packageRoot = path_1.default.dirname(packageConfigPath);
                results[name] = packageRoot;
                const maybeIsolatedModulesPath = (0, utils_2.getIsolatedModulesPath)(packageRoot, name);
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
async function resolveDependencyConfigAsync(platform, name, packageRoot, projectConfig) {
    const libraryConfig = await (0, reactNativeConfig_1.loadReactNativeConfigAsync)(packageRoot);
    const reactNativeConfig = {
        ...libraryConfig?.dependency,
        ...projectConfig?.dependencies[name],
    };
    if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
        // Package defines platforms would be a platform host package.
        // The rnc-cli will skip this package.
        // For example, the `react-native` package.
        return null;
    }
    let platformData = null;
    if (platform === 'android') {
        platformData = await (0, androidCompat_1.resolveDependencyConfigImplAndroidAsync)(packageRoot, reactNativeConfig.platforms?.android);
    }
    else if (platform === 'ios') {
        platformData = await (0, iosCompat_1.resolveDependencyConfigImplIosAsync)(packageRoot, reactNativeConfig.platforms?.ios);
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
//# sourceMappingURL=rncConfigCompat.js.map