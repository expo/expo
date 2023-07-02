"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPO_DEBUG = exports.INTERNAL_CALLSITES_REGEX = exports.loadAsync = exports.getDefaultConfig = void 0;
// Copyright 2023-present 650 Industries (Expo). All rights reserved.
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
const runtimeEnv = __importStar(require("@expo/env"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const metro_cache_1 = require("metro-cache");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const customizeFrame_1 = require("./customizeFrame");
Object.defineProperty(exports, "INTERNAL_CALLSITES_REGEX", { enumerable: true, get: function () { return customizeFrame_1.INTERNAL_CALLSITES_REGEX; } });
const env_1 = require("./env");
const getModulesPaths_1 = require("./getModulesPaths");
const getWatchFolders_1 = require("./getWatchFolders");
const rewriteRequestUrl_1 = require("./rewriteRequestUrl");
const withExpoSerializers_1 = require("./serializer/withExpoSerializers");
const postcss_1 = require("./transform-worker/postcss");
const metro_config_1 = require("./traveling/metro-config");
const debug = require('debug')('expo:metro:config');
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
    const { getDefaultConfig: getDefaultMetroConfig, mergeConfig } = (0, metro_config_1.importMetroConfig)(projectRoot);
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
    // Add support for cjs (without platform extensions).
    sourceExts.push('cjs');
    let sassVersion = null;
    if (options.isCSSEnabled) {
        sassVersion = getSassVersion(projectRoot);
        // Enable SCSS by default so we can provide a better error message
        // when sass isn't installed.
        sourceExts.push('scss', 'sass', 'css');
        process.env._EXPO_METRO_CSS_MODULES = '1';
    }
    if (options.isSVGEnabled) {
        sourceExts.push('svg');
        process.env._EXPO_METRO_SVG_MODULES = '1';
    }
    const envFiles = runtimeEnv.getFiles(process.env.NODE_ENV, { silent: true });
    const babelConfigPath = getProjectBabelConfigFile(projectRoot);
    const isCustomBabelConfigDefined = !!babelConfigPath;
    const resolverMainFields = [];
    // Disable `react-native` in exotic mode, since library authors
    // use it to ship raw application code to the project.
    if (!isExotic) {
        resolverMainFields.push('react-native');
    }
    resolverMainFields.push('browser', 'main');
    const pkg = (0, config_1.getPackageJson)(projectRoot);
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
        console.log(`- Env Files: ${envFiles}`);
        console.log(`- Sass: ${sassVersion}`);
        console.log();
    }
    const { 
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter, ...metroDefaultValues } = getDefaultMetroConfig.getDefaultValues(projectRoot);
    // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
    // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
    const metroConfig = mergeConfig(metroDefaultValues, {
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
        watcher: {
            // strip starting dot from env files
            additionalExts: envFiles.map((file) => file.replace(/^\./, '')),
        },
        serializer: {
            getModulesRunBeforeMainModule: () => {
                const preModules = [
                    // MUST be first
                    require.resolve(path_1.default.join(reactNativePath, 'Libraries/Core/InitializeCore')),
                ];
                // We need to shift this to be the first module so web Fast Refresh works as expected.
                // This will only be applied if the module is installed and imported somewhere in the bundle already.
                const metroRuntime = resolve_from_1.default.silent(projectRoot, '@expo/metro-runtime');
                if (metroRuntime) {
                    preModules.push(metroRuntime);
                }
                return preModules;
            },
            getPolyfills: () => require(path_1.default.join(reactNativePath, 'rn-get-polyfills'))(),
        },
        server: {
            rewriteRequestUrl: (0, rewriteRequestUrl_1.getRewriteRequestUrl)(projectRoot),
            port: Number(env_1.env.RCT_METRO_PORT) || 8081,
            // NOTE(EvanBacon): Moves the server root down to the monorepo root.
            // This enables proper monorepo support for web.
            unstable_serverRoot: (0, getModulesPaths_1.getServerRoot)(projectRoot),
        },
        symbolicator: {
            customizeFrame: (0, customizeFrame_1.getDefaultCustomizeFrame)(),
        },
        transformerPath: require.resolve('./transform-worker/transform-worker'),
        transformer: {
            // Custom: These are passed to `getCacheKey` and ensure invalidation when the version changes.
            // @ts-expect-error: not on type.
            postcssHash: (0, postcss_1.getPostcssConfigHash)(projectRoot),
            browserslistHash: pkg.browserslist
                ? (0, metro_cache_1.stableHash)(JSON.stringify(pkg.browserslist)).toString('hex')
                : null,
            sassVersion,
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
    return (0, withExpoSerializers_1.withExpoSerializers)(metroConfig);
}
exports.getDefaultConfig = getDefaultConfig;
async function loadAsync(projectRoot, { reporter, ...metroOptions } = {}) {
    let defaultConfig = getDefaultConfig(projectRoot);
    if (reporter) {
        defaultConfig = { ...defaultConfig, reporter };
    }
    const { loadConfig } = (0, metro_config_1.importMetroConfig)(projectRoot);
    return await loadConfig({ cwd: projectRoot, projectRoot, ...metroOptions }, defaultConfig);
}
exports.loadAsync = loadAsync;
// re-export for legacy cases.
exports.EXPO_DEBUG = env_1.env.EXPO_DEBUG;
function getSassVersion(projectRoot) {
    const sassPkg = resolve_from_1.default.silent(projectRoot, 'sass');
    if (!sassPkg)
        return null;
    const sassPkgJson = findUpPackageJson(sassPkg);
    if (!sassPkgJson)
        return null;
    const pkg = json_file_1.default.read(sassPkgJson);
    debug('sass package.json:', sassPkgJson);
    const sassVersion = pkg.version;
    if (typeof sassVersion === 'string') {
        return sassVersion;
    }
    return null;
}
function findUpPackageJson(cwd) {
    if (['.', path_1.default.sep].includes(cwd))
        return null;
    const found = resolve_from_1.default.silent(cwd, './package.json');
    if (found) {
        return found;
    }
    return findUpPackageJson(path_1.default.dirname(cwd));
}
