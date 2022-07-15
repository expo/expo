"use strict";
// Copyright 2021-present 650 Industries (Expo). All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAsync = exports.getDefaultConfig = exports.INTERNAL_CALLSITES_REGEX = exports.EXPO_DEBUG = void 0;
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
const chalk_1 = __importDefault(require("chalk"));
const getenv_1 = require("getenv");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const getModulesPaths_1 = require("./getModulesPaths");
const getWatchFolders_1 = require("./getWatchFolders");
const importMetroFromProject_1 = require("./importMetroFromProject");
exports.EXPO_DEBUG = (0, getenv_1.boolish)('EXPO_DEBUG', false);
const EXPO_USE_EXOTIC = (0, getenv_1.boolish)('EXPO_USE_EXOTIC', false);
// Import only the types here, the values will be imported from the project, at runtime.
exports.INTERNAL_CALLSITES_REGEX = new RegExp([
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Core/Timers/.+\\.js$',
    'node_modules/react-devtools-core/.+\\.js$',
    'node_modules/react-refresh/.+\\.js$',
    'node_modules/scheduler/.+\\.js$',
    // Metro replaces `require()` with a different method,
    // we want to omit this method from the stack trace.
    // This is akin to most React tooling.
    '/metro/.*/polyfills/require.js$',
    // Hide frames related to a fast refresh.
    '/metro/.*/lib/bundle-modules/.+\\.js$',
    '/metro/.*/lib/bundle-modules/.+\\.js$',
    'node_modules/react-native/Libraries/Utilities/HMRClient.js$',
    'node_modules/eventemitter3/index.js',
    'node_modules/event-target-shim/dist/.+\\.js$',
    // Ignore the log forwarder used in the Expo Go app
    '/expo/build/environment/react-native-logs.fx.js$',
    '/src/environment/react-native-logs.fx.ts$',
    '/expo/build/logs/RemoteConsole.js$',
    // Improve errors thrown by invariant (ex: `Invariant Violation: "main" has not been registered`).
    'node_modules/invariant/.+\\.js$',
    // Remove babel runtime additions
    'node_modules/regenerator-runtime/.+\\.js$',
    // Remove react native setImmediate ponyfill
    'node_modules/promise/setimmediate/.+\\.js$',
    // Babel helpers that implement language features
    'node_modules/@babel/runtime/.+\\.js$',
    // Block native code invocations
    `\\[native code\\]`,
].join('|'));
function readIsLegacyImportsEnabled(projectRoot) {
    const config = (0, config_1.getConfig)(projectRoot, { skipSDKVersionRequirement: true });
    return (0, config_1.isLegacyImportsEnabled)(config.exp);
}
function getProjectBabelConfigFile(projectRoot) {
    return (resolve_from_1.default.silent(projectRoot, './babel.config.js') ||
        resolve_from_1.default.silent(projectRoot, './.babelrc') ||
        resolve_from_1.default.silent(projectRoot, './.babelrc.js'));
}
function getAssetPlugins(projectRoot) {
    const assetPlugins = [];
    let hashAssetFilesPath;
    try {
        hashAssetFilesPath = (0, resolve_from_1.default)(projectRoot, 'expo-asset/tools/hashAssetFiles');
    }
    catch {
        // TODO: we should warn/throw an error if the user has expo-updates installed but does not
        // have hashAssetFiles available, or if the user is in managed workflow and does not have
        // hashAssetFiles available. but in a bare app w/o expo-updates, just using dev-client,
        // it is not needed
    }
    if (hashAssetFilesPath) {
        assetPlugins.push(hashAssetFilesPath);
    }
    return assetPlugins;
}
let hasWarnedAboutExotic = false;
function getDefaultConfig(projectRoot, options = {}) {
    const isExotic = options.mode === 'exotic' || EXPO_USE_EXOTIC;
    if (isExotic && !hasWarnedAboutExotic) {
        hasWarnedAboutExotic = true;
        console.log(chalk_1.default.gray(`\u203A Unstable feature ${chalk_1.default.bold `EXPO_USE_EXOTIC`} is enabled. Bundling may not work as expected, and is subject to breaking changes.`));
    }
    const MetroConfig = (0, importMetroFromProject_1.importMetroConfigFromProject)(projectRoot);
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
    const isLegacy = readIsLegacyImportsEnabled(projectRoot);
    // Deprecated -- SDK 41 --
    if (options.target) {
        if (!isLegacy) {
            console.warn(chalk_1.default.yellow(`The target option is deprecated. Learn more: http://expo.fyi/expo-extension-migration`));
            delete options.target;
        }
    }
    else if (process.env.EXPO_TARGET) {
        console.error('EXPO_TARGET is deprecated. Learn more: http://expo.fyi/expo-extension-migration');
        if (isLegacy) {
            // EXPO_TARGET is used by @expo/metro-config to determine the target when getDefaultConfig is
            // called from metro.config.js.
            // @ts-ignore
            options.target = process.env.EXPO_TARGET;
        }
    }
    else if (isLegacy) {
        // Fall back to guessing based on the project structure in legacy mode.
        options.target = (0, config_1.getDefaultTarget)(projectRoot);
    }
    if (!options.target) {
        // Default to bare -- no .expo extension.
        options.target = 'bare';
    }
    // End deprecated -- SDK 41 --
    const { target } = options;
    if (!(target === 'managed' || target === 'bare')) {
        throw new Error(`Invalid target: '${target}'. Debug info: \n${JSON.stringify({
            'options.target': options.target,
            default: (0, config_1.getDefaultTarget)(projectRoot),
        }, null, 2)}`);
    }
    const sourceExtsConfig = { isTS: true, isReact: true, isModern: false };
    const sourceExts = target === 'bare'
        ? (0, paths_1.getBareExtensions)([], sourceExtsConfig)
        : (0, paths_1.getManagedExtensions)([], sourceExtsConfig);
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
    if (exports.EXPO_DEBUG) {
        console.log();
        console.log(`Expo Metro config:`);
        try {
            console.log(`- Version: ${require('../package.json').version}`);
        }
        catch { }
        console.log(`- Bundler target: ${target}`);
        console.log(`- Legacy: ${isLegacy}`);
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
    reporter, ...metroDefaultValues } = MetroConfig.getDefaultConfig.getDefaultValues(projectRoot);
    // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
    // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
    return MetroConfig.mergeConfig(metroDefaultValues, {
        watchFolders,
        resolver: {
            resolverMainFields,
            platforms: ['ios', 'android', 'native', 'testing'],
            assetExts: metroDefaultValues.resolver.assetExts.filter(assetExt => !sourceExts.includes(assetExt)),
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
            port: Number(process.env.RCT_METRO_PORT) || 8081,
        },
        symbolicator: {
            customizeFrame: frame => {
                var _a;
                let collapse = Boolean(frame.file && exports.INTERNAL_CALLSITES_REGEX.test(frame.file));
                if (!collapse) {
                    // This represents the first frame of the stacktrace.
                    // Often this looks like: `__r(0);`.
                    // The URL will also be unactionable in the app and therefore not very useful to the developer.
                    if (frame.column === 3 &&
                        frame.methodName === 'global code' &&
                        ((_a = frame.file) === null || _a === void 0 ? void 0 : _a.match(/^https?:\/\//g))) {
                        collapse = true;
                    }
                }
                return { ...(frame || {}), collapse };
            },
        },
        transformer: {
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
async function loadAsync(projectRoot, { reporter, target, ...metroOptions } = {}) {
    let defaultConfig = getDefaultConfig(projectRoot, { target });
    if (reporter) {
        defaultConfig = { ...defaultConfig, reporter };
    }
    const MetroConfig = (0, importMetroFromProject_1.importMetroConfigFromProject)(projectRoot);
    return await MetroConfig.loadConfig({ cwd: projectRoot, projectRoot, ...metroOptions }, defaultConfig);
}
exports.loadAsync = loadAsync;
//# sourceMappingURL=ExpoMetroConfig.js.map