"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const flow_1 = require("./configs/flow");
const syntax_1 = require("./configs/syntax");
const typescript_1 = require("./configs/typescript");
function getOptions(options, platform) {
    const tag = platform === 'web' ? 'web' : 'native';
    return {
        ...options,
        ...options[tag],
    };
}
function babelPresetExpo(api, options = {}) {
    const bundler = api.caller(common_1.getBundler);
    const isWebpack = bundler === 'webpack';
    const platform = api.caller(common_1.getPlatform);
    const engine = api.caller(common_1.getEngine);
    const isDev = api.caller(common_1.getIsDev);
    const isNodeModule = api.caller(common_1.getIsNodeModule);
    const isServer = api.caller(common_1.getIsServer);
    const isReactServer = api.caller(common_1.getIsReactServer);
    const isFastRefreshEnabled = api.caller(common_1.getIsFastRefreshEnabled);
    const isReactCompilerEnabled = api.caller(common_1.getReactCompiler);
    const isDomComponent = api.caller(common_1.getIsDomComponent);
    const metroSourceType = api.caller(common_1.getMetroSourceType);
    const baseUrl = api.caller(common_1.getBaseUrl);
    const supportsStaticESM = api.caller(common_1.getStaticESM);
    const isServerEnv = isServer || isReactServer;
    // Unlike `isDev`, this will be `true` when the bundler is explicitly set to `production`,
    // i.e. `false` when testing, development, or used with a bundler that doesn't specify the correct inputs.
    const isProduction = api.caller(common_1.getIsProd);
    const inlineEnvironmentVariables = api.caller(common_1.getInlineEnvVarsEnabled);
    const platformOptions = getOptions(options, platform);
    // Use the simpler babel preset for web and server environments (both web and native SSR).
    // For DOM components, the webview may be an Android factory WebView that doesn't support many modern JavaScript features,
    // so we need to use the more compatible preset for web regardless.
    const isModernEngine = (platform === 'web' || isServerEnv) && !isDomComponent;
    // If the input is a script, we're unable to add any dependencies. Since the @babel/runtime transformer
    // adds extra dependencies (requires/imports) we need to disable it
    if (metroSourceType === 'script') {
        platformOptions.enableBabelRuntime = false;
    }
    if (platformOptions.disableImportExportTransform == null) {
        if (platform === 'web') {
            // Only disable import/export transform when Webpack is used because
            // Metro does not support tree-shaking.
            platformOptions.disableImportExportTransform = supportsStaticESM ?? isWebpack;
        }
        else {
            platformOptions.disableImportExportTransform = supportsStaticESM ?? false;
        }
    }
    if (platformOptions.unstable_transformProfile == null && !isDomComponent) {
        platformOptions.unstable_transformProfile = engine === 'hermes' ? 'hermes-stable' : 'default';
    }
    // Defaults to Babel caller's `babelRuntimeVersion` or the version of `@babel/runtime` for this package's peer
    // Set to `false` to disable `@babel/plugin-transform-runtime`
    const enableBabelRuntime = platformOptions.enableBabelRuntime == null || platformOptions.enableBabelRuntime === true
        ? api.caller(common_1.getBabelRuntimeVersion)
        : platformOptions.enableBabelRuntime;
    // Compute config fragments from helper modules to compose into the presets below.
    const flowFragment = (0, flow_1.getConfig)({ disableFlowStripTypesTransform: false });
    const tsFragment = (0, typescript_1.getConfig)();
    return {
        // Top-level overrides run before sub-preset plugins.
        // Flow/TypeScript type stripping must run before class-properties in the env configs.
        overrides: [...flowFragment.overrides, ...tsFragment.overrides],
        plugins: [...syntax_1.syntaxPlugins, ...flowFragment.plugins],
        presets: [
            // Module transforms preset is first so it runs last (Babel reverses preset order).
            // This ensures import/export transforms run after all other plugins have processed the code.
            [
                require('./configs/module-transforms'),
                {
                    enableBabelRuntime,
                    disableImportExportTransform: platformOptions.disableImportExportTransform,
                    lazyImportExportTransform: platformOptions.lazyImports,
                },
            ],
            (() => {
                const presetOpts = { dev: isDev };
                if (isDomComponent) {
                    return [require('./configs/webview'), presetOpts];
                }
                else if (isModernEngine) {
                    return [require('./configs/web'), presetOpts];
                }
                // Select the hermes config based on `unstable_transformProfile`, which is derived from
                // the caller's `engine` property or overridden by the user.
                switch (platformOptions.unstable_transformProfile) {
                    case 'hermes-stable':
                    case 'hermes-canary':
                        return [require('./configs/hermes-v1'), presetOpts];
                    case 'hermes-v0':
                    default:
                        return [require('./configs/hermes-v0'), presetOpts];
                }
            })(),
            // Expo-specific plugins and React JSX/compiler/refresh support.
            [
                require('./configs/expo'),
                {
                    platform,
                    engine,
                    isDev,
                    isProduction,
                    isServerEnv,
                    isReactServer,
                    isNodeModule,
                    isFastRefreshEnabled,
                    isReactCompilerEnabled,
                    isModernEngine,
                    baseUrl,
                    bundler,
                    inlineEnvironmentVariables,
                    disableDeepImportWarnings: platformOptions.disableDeepImportWarnings,
                    decorators: platformOptions.decorators,
                    reanimated: platformOptions.reanimated,
                    worklets: platformOptions.worklets,
                    expoUi: platformOptions.expoUi,
                    reactCompiler: platformOptions['react-compiler'],
                    enableReactFastRefresh: platformOptions.enableReactFastRefresh,
                    minifyTypeofWindow: platformOptions.minifyTypeofWindow,
                    transformImportMeta: platformOptions.transformImportMeta,
                    disableImportExportTransform: platformOptions.disableImportExportTransform,
                    jsxRuntime: platformOptions.jsxRuntime,
                    jsxImportSource: platformOptions.jsxImportSource,
                },
            ],
        ],
    };
}
exports.default = babelPresetExpo;
module.exports = babelPresetExpo;
//# sourceMappingURL=index.js.map