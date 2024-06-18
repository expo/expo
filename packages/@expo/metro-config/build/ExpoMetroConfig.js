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
exports.EXPO_DEBUG = exports.INTERNAL_CALLSITES_REGEX = exports.getDefaultConfig = void 0;
// Copyright 2023-present 650 Industries (Expo). All rights reserved.
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
const runtimeEnv = __importStar(require("@expo/env"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const metro_cache_1 = require("metro-cache");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const customizeFrame_1 = require("./customizeFrame");
Object.defineProperty(exports, "INTERNAL_CALLSITES_REGEX", { enumerable: true, get: function () { return customizeFrame_1.INTERNAL_CALLSITES_REGEX; } });
const env_1 = require("./env");
const file_store_1 = require("./file-store");
const getModulesPaths_1 = require("./getModulesPaths");
const getWatchFolders_1 = require("./getWatchFolders");
const rewriteRequestUrl_1 = require("./rewriteRequestUrl");
const withExpoSerializers_1 = require("./serializer/withExpoSerializers");
const postcss_1 = require("./transform-worker/postcss");
const metro_config_1 = require("./traveling/metro-config");
const debug = require('debug')('expo:metro:config');
function getAssetPlugins(projectRoot) {
    const hashAssetFilesPath = resolve_from_1.default.silent(projectRoot, 'expo-asset/tools/hashAssetFiles');
    if (!hashAssetFilesPath) {
        throw new Error(`The required package \`expo-asset\` cannot be found`);
    }
    return [hashAssetFilesPath];
}
let hasWarnedAboutExotic = false;
// Patch Metro's graph to support always parsing certain modules. This enables
// things like Tailwind CSS which update based on their own heuristics.
function patchMetroGraphToSupportUncachedModules() {
    const { Graph } = require('metro/src/DeltaBundler/Graph');
    const original_traverseDependencies = Graph.prototype.traverseDependencies;
    if (!original_traverseDependencies.__patched) {
        original_traverseDependencies.__patched = true;
        Graph.prototype.traverseDependencies = function (paths, options) {
            this.dependencies.forEach((dependency) => {
                // Find any dependencies that have been marked as `skipCache` and ensure they are invalidated.
                // `skipCache` is set when a CSS module is found by PostCSS.
                if (dependency.output.find((file) => file.data.css?.skipCache) &&
                    !paths.includes(dependency.path)) {
                    // Ensure we invalidate the `unstable_transformResultKey` (input hash) so the module isn't removed in
                    // the Graph._processModule method.
                    dependency.unstable_transformResultKey = dependency.unstable_transformResultKey + '.';
                    // Add the path to the list of modified paths so it gets run through the transformer again,
                    // this will ensure it is passed to PostCSS -> Tailwind.
                    paths.push(dependency.path);
                }
            });
            // Invoke the original method with the new paths to ensure the standard behavior is preserved.
            return original_traverseDependencies.call(this, paths, options);
        };
        // Ensure we don't patch the method twice.
        Graph.prototype.traverseDependencies.__patched = true;
    }
}
function getDefaultConfig(projectRoot, { mode, isCSSEnabled = true, unstable_beforeAssetSerializationPlugins } = {}) {
    const { getDefaultConfig: getDefaultMetroConfig, mergeConfig } = (0, metro_config_1.importMetroConfig)(projectRoot);
    if (isCSSEnabled) {
        patchMetroGraphToSupportUncachedModules();
    }
    const isExotic = mode === 'exotic' || env_1.env.EXPO_USE_EXOTIC;
    if (isExotic && !hasWarnedAboutExotic) {
        hasWarnedAboutExotic = true;
        console.log(chalk_1.default.gray(`\u203A Feature ${chalk_1.default.bold `EXPO_USE_EXOTIC`} has been removed in favor of the default transformer.`));
    }
    const reactNativePath = path_1.default.dirname((0, resolve_from_1.default)(projectRoot, 'react-native/package.json'));
    const sourceExtsConfig = { isTS: true, isReact: true, isModern: true };
    const sourceExts = (0, paths_1.getBareExtensions)([], sourceExtsConfig);
    // Add support for cjs (without platform extensions).
    sourceExts.push('cjs');
    const reanimatedVersion = getPkgVersion(projectRoot, 'react-native-reanimated');
    let sassVersion = null;
    if (isCSSEnabled) {
        sassVersion = getPkgVersion(projectRoot, 'sass');
        // Enable SCSS by default so we can provide a better error message
        // when sass isn't installed.
        sourceExts.push('scss', 'sass', 'css');
    }
    const envFiles = runtimeEnv.getFiles(process.env.NODE_ENV, { silent: true });
    const pkg = (0, config_1.getPackageJson)(projectRoot);
    const watchFolders = (0, getWatchFolders_1.getWatchFolders)(projectRoot);
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
        console.log(`- Watch Folders: ${watchFolders.join(', ')}`);
        console.log(`- Node Module Paths: ${nodeModulesPaths.join(', ')}`);
        console.log(`- Env Files: ${envFiles}`);
        console.log(`- Sass: ${sassVersion}`);
        console.log(`- Reanimated: ${reanimatedVersion}`);
        console.log();
    }
    const { 
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter, ...metroDefaultValues } = getDefaultMetroConfig.getDefaultValues(projectRoot);
    const cacheStore = new file_store_1.FileStore({
        root: path_1.default.join(os_1.default.tmpdir(), 'metro-cache'),
    });
    const serverRoot = (0, getModulesPaths_1.getServerRoot)(projectRoot);
    // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
    // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
    const metroConfig = mergeConfig(metroDefaultValues, {
        watchFolders,
        resolver: {
            unstable_conditionsByPlatform: {
                ios: ['react-native'],
                android: ['react-native'],
                // This is removed for server platforms.
                web: ['browser'],
            },
            unstable_conditionNames: ['require', 'import'],
            resolverMainFields: ['react-native', 'browser', 'main'],
            platforms: ['ios', 'android'],
            assetExts: metroDefaultValues.resolver.assetExts
                .concat(
            // Add default support for `expo-image` file types.
            ['heic', 'avif'], 
            // Add default support for `expo-sqlite` file types.
            ['db'])
                .filter((assetExt) => !sourceExts.includes(assetExt)),
            sourceExts,
            nodeModulesPaths,
        },
        cacheStores: [cacheStore],
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
                const stdRuntime = resolve_from_1.default.silent(projectRoot, 'expo/build/winter');
                if (stdRuntime) {
                    preModules.push(stdRuntime);
                }
                // We need to shift this to be the first module so web Fast Refresh works as expected.
                // This will only be applied if the module is installed and imported somewhere in the bundle already.
                const metroRuntime = resolve_from_1.default.silent(projectRoot, '@expo/metro-runtime');
                if (metroRuntime) {
                    preModules.push(metroRuntime);
                }
                return preModules;
            },
            getPolyfills: ({ platform }) => {
                // Do nothing for nullish platforms.
                if (!platform) {
                    return [];
                }
                if (platform === 'web') {
                    return [
                        // Ensure that the error-guard polyfill is included in the web polyfills to
                        // make metro-runtime work correctly.
                        require.resolve('@react-native/js-polyfills/error-guard'),
                    ];
                }
                // Native behavior.
                return require('@react-native/js-polyfills')();
            },
        },
        server: {
            rewriteRequestUrl: (0, rewriteRequestUrl_1.getRewriteRequestUrl)(projectRoot),
            port: Number(env_1.env.RCT_METRO_PORT) || 8081,
            // NOTE(EvanBacon): Moves the server root down to the monorepo root.
            // This enables proper monorepo support for web.
            unstable_serverRoot: serverRoot,
        },
        symbolicator: {
            customizeFrame: (0, customizeFrame_1.getDefaultCustomizeFrame)(),
        },
        transformerPath: require.resolve('./transform-worker/transform-worker'),
        transformer: {
            // Custom: These are passed to `getCacheKey` and ensure invalidation when the version changes.
            // @ts-expect-error: not on type.
            unstable_renameRequire: false,
            postcssHash: (0, postcss_1.getPostcssConfigHash)(projectRoot),
            browserslistHash: pkg.browserslist
                ? (0, metro_cache_1.stableHash)(JSON.stringify(pkg.browserslist)).toString('hex')
                : null,
            sassVersion,
            // Ensure invalidation when the version changes due to the Babel plugin.
            reanimatedVersion,
            // Ensure invalidation when using identical projects in monorepos
            _expoRelativeProjectRoot: path_1.default.relative(serverRoot, projectRoot),
            // `require.context` support
            unstable_allowRequireContext: true,
            allowOptionalDependencies: true,
            babelTransformerPath: require.resolve('./babel-transformer'),
            // See: https://github.com/facebook/react-native/blob/v0.73.0/packages/metro-config/index.js#L72-L74
            asyncRequireModulePath: (0, resolve_from_1.default)(reactNativePath, metroDefaultValues.transformer.asyncRequireModulePath),
            assetRegistryPath: '@react-native/assets-registry/registry',
            assetPlugins: getAssetPlugins(projectRoot),
            getTransformOptions: async () => ({
                transform: {
                    experimentalImportSupport: false,
                    inlineRequires: false,
                },
            }),
        },
    });
    return (0, withExpoSerializers_1.withExpoSerializers)(metroConfig, { unstable_beforeAssetSerializationPlugins });
}
exports.getDefaultConfig = getDefaultConfig;
// re-export for legacy cases.
exports.EXPO_DEBUG = env_1.env.EXPO_DEBUG;
function getPkgVersion(projectRoot, pkgName) {
    const targetPkg = resolve_from_1.default.silent(projectRoot, pkgName);
    if (!targetPkg)
        return null;
    const targetPkgJson = findUpPackageJson(targetPkg);
    if (!targetPkgJson)
        return null;
    const pkg = json_file_1.default.read(targetPkgJson);
    debug(`${pkgName} package.json:`, targetPkgJson);
    const pkgVersion = pkg.version;
    if (typeof pkgVersion === 'string') {
        return pkgVersion;
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
//# sourceMappingURL=ExpoMetroConfig.js.map