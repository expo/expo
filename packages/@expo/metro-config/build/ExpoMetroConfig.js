"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPO_DEBUG = exports.INTERNAL_CALLSITES_REGEX = exports.loadAsync = exports.getDefaultConfig = void 0;
// Copyright 2023-present 650 Industries (Expo). All rights reserved.
const paths_1 = require("@expo/config/paths");
const chalk_1 = __importDefault(require("chalk"));
const metro_config_1 = require("metro-config");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const customizeFrame_1 = require("./customizeFrame");
Object.defineProperty(exports, "INTERNAL_CALLSITES_REGEX", { enumerable: true, get: function () { return customizeFrame_1.INTERNAL_CALLSITES_REGEX; } });
const env_1 = require("./env");
const getModulesPaths_1 = require("./getModulesPaths");
const getWatchFolders_1 = require("./getWatchFolders");
const rewriteRequestUrl_1 = require("./rewriteRequestUrl");
function getProjectBabelConfigFile(projectRoot) {
    return (resolve_from_1.default.silent(projectRoot, './babel.config.js') ||
        resolve_from_1.default.silent(projectRoot, './.babelrc') ||
        resolve_from_1.default.silent(projectRoot, './.babelrc.js'));
}
function getAssetPlugins(projectRoot) {
    const hashAssetFilesPath = resolve_from_1.default.silent(projectRoot, 'expo-asset/tools/hashAssetFiles');
    if (!hashAssetFilesPath) {
        throw new Error(`The required package \`expo-asset\` cannot be found`);
    }
    return [hashAssetFilesPath];
}
let hasWarnedAboutExotic = false;
function getDefaultConfig(projectRoot, options = {}) {
    const isExotic = options.mode === 'exotic' || env_1.env.EXPO_USE_EXOTIC;
    if (isExotic && !hasWarnedAboutExotic) {
        hasWarnedAboutExotic = true;
        console.log(chalk_1.default.gray(`\u203A Unstable feature ${chalk_1.default.bold `EXPO_USE_EXOTIC`} is enabled. Bundling may not work as expected, and is subject to breaking changes.`));
    }
    const reactNativePath = path_1.default.dirname((0, resolve_from_1.default)(projectRoot, 'react-native/package.json'));
    try {
        // Set the `EXPO_METRO_CACHE_KEY_VERSION` variable for use in the custom babel transformer.
        // This hack is used because there doesn't appear to be anyway to resolve
        // `babel-preset-fbjs` relative to the project root later (in `metro-expo-babel-transformer`).
        const babelPresetFbjsPath = (0, resolve_from_1.default)(projectRoot, 'babel-preset-fbjs/package.json');
        process.env.EXPO_METRO_CACHE_KEY_VERSION = String(require(babelPresetFbjsPath).version);
    }
    catch {
        // noop -- falls back to a hardcoded value.
    }
    const sourceExtsConfig = { isTS: true, isReact: true, isModern: false };
    const sourceExts = (0, paths_1.getBareExtensions)([], sourceExtsConfig);
    if (isExotic) {
        // Add support for cjs (without platform extensions).
        sourceExts.push('cjs');
    }
    const babelConfigPath = getProjectBabelConfigFile(projectRoot);
    const isCustomBabelConfigDefined = !!babelConfigPath;
    const resolverMainFields = [];
    // Disable `react-native` in exotic mode, since library authors
    // use it to ship raw application code to the project.
    if (!isExotic) {
        resolverMainFields.push('react-native');
    }
    resolverMainFields.push('browser', 'main');
    const watchFolders = (0, getWatchFolders_1.getWatchFolders)(projectRoot);
    // TODO: nodeModulesPaths does not work with the new Node.js package.json exports API, this causes packages like uuid to fail. Disabling for now.
    const nodeModulesPaths = (0, getModulesPaths_1.getModulesPaths)(projectRoot);
    if (env_1.env.EXPO_DEBUG) {
        console.log();
        console.log(`Expo Metro config:`);
        try {
            console.log(`- Version: ${require('../package.json').version}`);
        }
        catch { }
        console.log(`- Extensions: ${sourceExts.join(', ')}`);
        console.log(`- React Native: ${reactNativePath}`);
        console.log(`- Babel config: ${babelConfigPath || 'babel-preset-expo (default)'}`);
        console.log(`- Resolver Fields: ${resolverMainFields.join(', ')}`);
        console.log(`- Watch Folders: ${watchFolders.join(', ')}`);
        console.log(`- Node Module Paths: ${nodeModulesPaths.join(', ')}`);
        console.log(`- Exotic: ${isExotic}`);
        console.log();
    }
    const { 
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter, ...metroDefaultValues } = metro_config_1.getDefaultConfig.getDefaultValues(projectRoot);
    // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
    // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
    return (0, metro_config_1.mergeConfig)(metroDefaultValues, {
        watchFolders,
        resolver: {
            resolverMainFields,
            platforms: ['ios', 'android'],
            assetExts: metroDefaultValues.resolver.assetExts
                .concat(
            // Add default support for `expo-image` file types.
            ['heic', 'avif'])
                .filter((assetExt) => !sourceExts.includes(assetExt)),
            sourceExts,
            nodeModulesPaths,
        },
        serializer: {
            getModulesRunBeforeMainModule: () => [
                require.resolve(path_1.default.join(reactNativePath, 'Libraries/Core/InitializeCore')),
                // TODO: Bacon: load Expo side-effects
            ],
            getPolyfills: () => require(path_1.default.join(reactNativePath, 'rn-get-polyfills'))(),
        },
        server: {
            rewriteRequestUrl: (0, rewriteRequestUrl_1.getRewriteRequestUrl)(projectRoot),
            port: Number(env_1.env.RCT_METRO_PORT) || 8081,
            // NOTE(EvanBacon): Moves the server root down to the monorepo root.
            // This enables proper monorepo support for web.
            // @ts-expect-error: not on type
            unstable_serverRoot: (0, getModulesPaths_1.getServerRoot)(projectRoot),
        },
        symbolicator: {
            customizeFrame: (0, customizeFrame_1.getDefaultCustomizeFrame)(),
        },
        transformer: {
            // `require.context` support
            unstable_allowRequireContext: true,
            allowOptionalDependencies: true,
            babelTransformerPath: isExotic
                ? require.resolve('./transformer/metro-expo-exotic-babel-transformer')
                : isCustomBabelConfigDefined
                    ? // If the user defined a babel config file in their project,
                        // then use the default transformer.
                        // Try to use the project copy before falling back on the global version
                        resolve_from_1.default.silent(projectRoot, 'metro-react-native-babel-transformer')
                    : // Otherwise, use a custom transformer that uses `babel-preset-expo` by default for projects.
                        require.resolve('./transformer/metro-expo-babel-transformer'),
            assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
            assetPlugins: getAssetPlugins(projectRoot),
        },
    });
}
exports.getDefaultConfig = getDefaultConfig;
async function loadAsync(projectRoot, { reporter, ...metroOptions } = {}) {
    let defaultConfig = getDefaultConfig(projectRoot);
    if (reporter) {
        defaultConfig = { ...defaultConfig, reporter };
    }
    return await (0, metro_config_1.loadConfig)({ cwd: projectRoot, projectRoot, ...metroOptions }, defaultConfig);
}
exports.loadAsync = loadAsync;
// re-export for legacy cases.
exports.EXPO_DEBUG = env_1.env.EXPO_DEBUG;
