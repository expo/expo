"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPO_DEBUG = exports.INTERNAL_CALLSITES_REGEX = void 0;
exports.createStableModuleIdFactory = createStableModuleIdFactory;
exports.getDefaultConfig = getDefaultConfig;
// Copyright 2023-present 650 Industries (Expo). All rights reserved.
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
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
const sideEffects_1 = require("./serializer/sideEffects");
const withExpoSerializers_1 = require("./serializer/withExpoSerializers");
const postcss_1 = require("./transform-worker/postcss");
const metro_config_1 = require("./traveling/metro-config");
const filePath_1 = require("./utils/filePath");
const debug = require('debug')('expo:metro:config');
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
function createNumericModuleIdFactory() {
    const fileToIdMap = new Map();
    let nextId = 0;
    return (modulePath) => {
        let id = fileToIdMap.get(modulePath);
        if (typeof id !== 'number') {
            id = nextId++;
            fileToIdMap.set(modulePath, id);
        }
        return id;
    };
}
function memoize(fn) {
    const cache = new Map();
    return ((...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
function createStableModuleIdFactory(root) {
    const getModulePath = (modulePath, scope) => {
        // NOTE: Metro allows this but it can lead to confusing errors when dynamic requires cannot be resolved, e.g. `module 456 cannot be found`.
        if (modulePath == null) {
            return 'MODULE_NOT_FOUND';
        }
        else if ((0, sideEffects_1.isVirtualModule)(modulePath)) {
            // Virtual modules should be stable.
            return modulePath;
        }
        else if (path_1.default.isAbsolute(modulePath)) {
            return (0, filePath_1.toPosixPath)(path_1.default.relative(root, modulePath)) + scope;
        }
        else {
            return (0, filePath_1.toPosixPath)(modulePath) + scope;
        }
    };
    const memoizedGetModulePath = memoize(getModulePath);
    // This is an absolute file path.
    // TODO: We may want a hashed version for production builds in the future.
    return (modulePath, context) => {
        const env = context?.environment ?? 'client';
        if (env === 'client') {
            // Only need scope for server bundles where multiple dimensions could run simultaneously.
            // @ts-expect-error: we patch this to support being a string.
            return memoizedGetModulePath(modulePath, '');
        }
        // Helps find missing parts to the patch.
        if (!context?.platform) {
            // context = { platform: 'web' };
            throw new Error('createStableModuleIdFactory: `context.platform` is required');
        }
        // Only need scope for server bundles where multiple dimensions could run simultaneously.
        const scope = env !== 'client' ? `?platform=${context?.platform}&env=${env}` : '';
        // @ts-expect-error: we patch this to support being a string.
        return memoizedGetModulePath(modulePath, scope);
    };
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
    const serverRoot = (0, paths_1.getMetroServerRoot)(projectRoot);
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
            // strip starting dot from env files. We only support watching development variants of env files as production is inlined using a different system.
            additionalExts: ['env', 'local', 'development'],
        },
        serializer: {
            isThirdPartyModule(module) {
                // Block virtual modules from appearing in the source maps.
                if ((0, sideEffects_1.isVirtualModule)(module.path))
                    return true;
                // Generally block node modules
                if (/(?:^|[/\\])node_modules[/\\]/.test(module.path)) {
                    // Allow the expo-router/entry and expo/AppEntry modules to be considered first party so the root of the app appears in the trace.
                    return !module.path.match(/[/\\](expo-router[/\\]entry|expo[/\\]AppEntry)/);
                }
                return false;
            },
            createModuleIdFactory: env_1.env.EXPO_USE_METRO_REQUIRE
                ? createStableModuleIdFactory.bind(null, serverRoot)
                : createNumericModuleIdFactory,
            getModulesRunBeforeMainModule: () => {
                const preModules = [
                    // MUST be first
                    require.resolve(path_1.default.join(reactNativePath, 'Libraries/Core/InitializeCore')),
                ];
                const stdRuntime = resolve_from_1.default.silent(projectRoot, 'expo/src/winter/index.ts');
                if (stdRuntime) {
                    preModules.push(stdRuntime);
                }
                else {
                    debug('@expo/metro-runtime not found, this may cause issues');
                }
                // We need to shift this to be the first module so web Fast Refresh works as expected.
                // This will only be applied if the module is installed and imported somewhere in the bundle already.
                const metroRuntime = resolve_from_1.default.silent(projectRoot, '@expo/metro-runtime');
                if (metroRuntime) {
                    preModules.push(metroRuntime);
                }
                else {
                    debug('@expo/metro-runtime not found, this may cause issues');
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
        // NOTE: All of these values are used in the cache key. They should not contain any absolute paths.
        transformer: {
            // Custom: These are passed to `getCacheKey` and ensure invalidation when the version changes.
            unstable_renameRequire: false,
            // @ts-expect-error: not on type.
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
            // TODO: The absolute path invalidates caching across devices.
            asyncRequireModulePath: require.resolve('./async-require'),
            assetRegistryPath: '@react-native/assets-registry/registry',
            // hermesParser: true,
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