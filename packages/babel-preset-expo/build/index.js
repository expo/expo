"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_module_proxy_plugin_1 = require("./client-module-proxy-plugin");
const common_1 = require("./common");
const environment_restricted_imports_1 = require("./environment-restricted-imports");
const expo_inline_manifest_plugin_1 = require("./expo-inline-manifest-plugin");
const expo_router_plugin_1 = require("./expo-router-plugin");
const import_meta_transform_plugin_1 = require("./import-meta-transform-plugin");
const inline_env_vars_1 = require("./inline-env-vars");
const lazyImports_1 = require("./lazyImports");
const restricted_react_api_plugin_1 = require("./restricted-react-api-plugin");
const server_actions_plugin_1 = require("./server-actions-plugin");
const use_dom_directive_plugin_1 = require("./use-dom-directive-plugin");
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
    let platform = api.caller((caller) => caller?.platform);
    const engine = api.caller((caller) => caller?.engine) ?? 'default';
    const isDev = api.caller(common_1.getIsDev);
    const isNodeModule = api.caller(common_1.getIsNodeModule);
    const isServer = api.caller(common_1.getIsServer);
    const isReactServer = api.caller(common_1.getIsReactServer);
    const isFastRefreshEnabled = api.caller(common_1.getIsFastRefreshEnabled);
    const isReactCompilerEnabled = api.caller(common_1.getReactCompiler);
    const metroSourceType = api.caller(common_1.getMetroSourceType);
    const baseUrl = api.caller(common_1.getBaseUrl);
    const supportsStaticESM = api.caller((caller) => caller?.supportsStaticESM);
    const isServerEnv = isServer || isReactServer;
    // Unlike `isDev`, this will be `true` when the bundler is explicitly set to `production`,
    // i.e. `false` when testing, development, or used with a bundler that doesn't specify the correct inputs.
    const isProduction = api.caller(common_1.getIsProd);
    const inlineEnvironmentVariables = api.caller(common_1.getInlineEnvVarsEnabled);
    // If the `platform` prop is not defined then this must be a custom config that isn't
    // defining a platform in the babel-loader. Currently this may happen with Next.js + Expo web.
    if (!platform && isWebpack) {
        platform = 'web';
    }
    // Use the simpler babel preset for web and server environments (both web and native SSR).
    const isModernEngine = platform === 'web' || isServerEnv;
    const platformOptions = getOptions(options, platform);
    // If the input is a script, we're unable to add any dependencies. Since the @babel/runtime transformer
    // adds extra dependencies (requires/imports) we need to disable it
    if (metroSourceType === 'script') {
        platformOptions.enableBabelRuntime = false;
    }
    if (platformOptions.useTransformReactJSXExperimental != null) {
        throw new Error(`babel-preset-expo: The option 'useTransformReactJSXExperimental' has been removed in favor of { jsxRuntime: 'classic' }.`);
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
    if (platformOptions.unstable_transformProfile == null) {
        platformOptions.unstable_transformProfile = engine === 'hermes' ? 'hermes-stable' : 'default';
    }
    // Note that if `options.lazyImports` is not set (i.e., `null` or `undefined`),
    // `@react-native/babel-preset` will handle it.
    const lazyImportsOption = platformOptions?.lazyImports;
    const extraPlugins = [];
    // Add compiler as soon as possible to prevent other plugins from modifying the code.
    if (isReactCompilerEnabled &&
        // Don't run compiler on node modules, it can only safely be run on the user's code.
        !isNodeModule &&
        // Only run for client code. It's unclear if compiler has any benefits for React Server Components.
        // NOTE: We might want to allow running it to prevent hydration errors.
        !isServerEnv &&
        // Give users the ability to opt-out of the feature, per-platform.
        platformOptions['react-compiler'] !== false) {
        if (!(0, common_1.hasModule)('babel-plugin-react-compiler')) {
            throw new Error('The `babel-plugin-react-compiler` must be installed before you can use React Compiler.');
        }
        extraPlugins.push([
            require('babel-plugin-react-compiler'),
            {
                target: '19',
                environment: {
                    enableResetCacheOnSourceFileChanges: !isProduction,
                    ...(platformOptions['react-compiler']?.environment ?? {}),
                },
                panicThreshold: isDev ? undefined : 'NONE',
                ...platformOptions['react-compiler'],
            },
        ]);
    }
    if (engine !== 'hermes') {
        // `@react-native/babel-preset` configures this plugin with `{ loose: true }`, which breaks all
        // getters and setters in spread objects. We need to add this plugin ourself without that option.
        // @see https://github.com/expo/expo/pull/11960#issuecomment-887796455
        extraPlugins.push([
            require('@babel/plugin-transform-object-rest-spread'),
            // Assume no dependence on getters or evaluation order. See https://github.com/babel/babel/pull/11520
            { loose: true, useBuiltIns: true },
        ]);
    }
    else if (!isModernEngine) {
        // This is added back on hermes to ensure the react-jsx-dev plugin (`@babel/preset-react`) works as expected when
        // JSX is used in a function body. This is technically not required in production, but we
        // should retain the same behavior since it's hard to debug the differences.
        extraPlugins.push(require('@babel/plugin-transform-parameters'));
    }
    const inlines = {
        'process.env.EXPO_OS': platform,
        // 'typeof document': isServerEnv ? 'undefined' : 'object',
        'process.env.EXPO_SERVER': !!isServerEnv,
    };
    // `typeof window` is left in place for native + client environments.
    const minifyTypeofWindow = (platformOptions.minifyTypeofWindow ?? isServerEnv) || platform === 'web';
    if (minifyTypeofWindow !== false) {
        // This nets out slightly faster in development when considering the cost of bundling server dependencies.
        inlines['typeof window'] = isServerEnv ? 'undefined' : 'object';
    }
    if (isProduction) {
        inlines['process.env.NODE_ENV'] = 'production';
        inlines['__DEV__'] = false;
        inlines['Platform.OS'] = platform;
    }
    if (process.env.NODE_ENV !== 'test') {
        inlines['process.env.EXPO_BASE_URL'] = baseUrl;
    }
    extraPlugins.push([require('./define-plugin'), inlines]);
    if (isProduction) {
        // Metro applies a version of this plugin too but it does it after the Platform modules have been transformed to CJS, this breaks the transform.
        // Here, we'll apply it before the commonjs transform, in production only, to ensure `Platform.OS` is replaced with a string literal.
        extraPlugins.push([
            require('./minify-platform-select-plugin'),
            {
                platform,
            },
        ]);
    }
    if (platformOptions.useTransformReactJSXExperimental != null) {
        throw new Error(`babel-preset-expo: The option 'useTransformReactJSXExperimental' has been removed in favor of { jsxRuntime: 'classic' }.`);
    }
    // Only apply in non-server, for metro-only, in production environments, when the user hasn't disabled the feature.
    // Webpack uses DefinePlugin for environment variables.
    // Development uses an uncached serializer.
    // Servers read from the environment.
    // Users who disable the feature may be using a different babel plugin.
    if (inlineEnvironmentVariables) {
        extraPlugins.push(inline_env_vars_1.expoInlineEnvVars);
    }
    if (platform === 'web') {
        extraPlugins.push(require('babel-plugin-react-native-web'));
    }
    // Webpack uses the DefinePlugin to provide the manifest to `expo-constants`.
    if (bundler !== 'webpack') {
        extraPlugins.push(expo_inline_manifest_plugin_1.expoInlineManifestPlugin);
    }
    if ((0, common_1.hasModule)('expo-router')) {
        extraPlugins.push(expo_router_plugin_1.expoRouterBabelPlugin);
    }
    extraPlugins.push(client_module_proxy_plugin_1.reactClientReferencesPlugin);
    // Ensure these only run when the user opts-in to bundling for a react server to prevent unexpected behavior for
    // users who are bundling using the client-only system.
    if (isReactServer) {
        extraPlugins.push(server_actions_plugin_1.reactServerActionsPlugin);
        extraPlugins.push(restricted_react_api_plugin_1.environmentRestrictedReactAPIsPlugin);
    }
    else {
        // DOM components must run after "use client" and only in client environments.
        extraPlugins.push(use_dom_directive_plugin_1.expoUseDomDirectivePlugin);
    }
    // This plugin is fine to run whenever as the server-only imports were introduced as part of RSC and shouldn't be used in any client code.
    extraPlugins.push(environment_restricted_imports_1.environmentRestrictedImportsPlugin);
    if (isFastRefreshEnabled) {
        extraPlugins.push([
            require('react-refresh/babel'),
            {
                // We perform the env check to enable `isFastRefreshEnabled`.
                skipEnvCheck: true,
            },
        ]);
    }
    if (platformOptions.disableImportExportTransform) {
        extraPlugins.push([require('./detect-dynamic-exports').detectDynamicExports]);
    }
    const polyfillImportMeta = platformOptions.unstable_transformImportMeta ?? isServerEnv;
    extraPlugins.push((0, import_meta_transform_plugin_1.expoImportMetaTransformPluginFactory)(polyfillImportMeta === true));
    return {
        presets: [
            (() => {
                const presetOpts = {
                    // Defaults to undefined, set to `true` to disable `@babel/plugin-transform-flow-strip-types`
                    disableFlowStripTypesTransform: platformOptions.disableFlowStripTypesTransform,
                    // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
                    enableBabelRuntime: platformOptions.enableBabelRuntime,
                    // This reduces the amount of transforms required, as Hermes supports many modern language features.
                    unstable_transformProfile: platformOptions.unstable_transformProfile,
                    // Set true to disable `@babel/plugin-transform-react-jsx` and
                    // the deprecated packages `@babel/plugin-transform-react-jsx-self`, and `@babel/plugin-transform-react-jsx-source`.
                    //
                    // Otherwise, you'll sometime get errors like the following (starting in Expo SDK 43, React Native 64, React 17):
                    //
                    // TransformError App.js: /path/to/App.js: Duplicate __self prop found. You are most likely using the deprecated transform-react-jsx-self Babel plugin.
                    // Both __source and __self are automatically set when using the automatic jsxRuntime. Please remove transform-react-jsx-source and transform-react-jsx-self from your Babel config.
                    useTransformReactJSXExperimental: true,
                    // This will never be used regardless because `useTransformReactJSXExperimental` is set to `true`.
                    // https://github.com/facebook/react-native/blob/a4a8695cec640e5cf12be36a0c871115fbce9c87/packages/react-native-babel-preset/src/configs/main.js#L151
                    withDevTools: false,
                    disableImportExportTransform: platformOptions.disableImportExportTransform,
                    lazyImportExportTransform: lazyImportsOption === true
                        ? (importModuleSpecifier) => {
                            // Do not lazy-initialize packages that are local imports (similar to `lazy: true`
                            // behavior) or are in the blacklist.
                            return !(importModuleSpecifier.includes('./') || lazyImports_1.lazyImports.has(importModuleSpecifier));
                        }
                        : // Pass the option directly to `@react-native/babel-preset`, which in turn
                            // passes it to `babel-plugin-transform-modules-commonjs`
                            lazyImportsOption,
                    dev: isDev,
                };
                if (isModernEngine) {
                    return [require('./web-preset'), presetOpts];
                }
                // We use `require` here instead of directly using the package name because we want to
                // specifically use the `@react-native/babel-preset` installed by this package (ex:
                // `babel-preset-expo/node_modules/`). This way the preset will not change unintentionally.
                // Reference: https://github.com/expo/expo/pull/4685#discussion_r307143920
                const { getPreset } = require('@react-native/babel-preset');
                // We need to customize the `@react-native/babel-preset` to ensure that the `@babel/plugin-transform-export-namespace-from`
                // plugin is run after the TypeScript plugins. This is normally handled by the combination of standard `@babel/preset-env` and `@babel/preset-typescript` but React Native
                // doesn't do that and we can't rely on Hermes spec compliance enough to use standard presets.
                const babelPresetReactNativeEnv = getPreset(null, presetOpts);
                // Add the `@babel/plugin-transform-export-namespace-from` plugin to the preset but ensure it runs after
                // the TypeScript plugins to ensure namespace type exports (TypeScript 5.0+) `export type * as Types from './module';`
                // are stripped before the transform. Otherwise the transform will extraneously include the types as syntax.
                babelPresetReactNativeEnv.overrides.push({
                    plugins: [require('@babel/plugin-transform-export-namespace-from')],
                });
                return babelPresetReactNativeEnv;
            })(),
            // React support with similar options to Metro.
            // We override this logic outside of the metro preset so we can add support for
            // React 17 automatic JSX transformations.
            // The only known issue is the plugin `@babel/plugin-transform-react-display-name` will be run twice,
            // once in the Metro plugin, and another time here.
            [
                require('@babel/preset-react'),
                {
                    development: isDev,
                    // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
                    runtime: platformOptions?.jsxRuntime || 'automatic',
                    ...(platformOptions &&
                        platformOptions.jsxRuntime !== 'classic' && {
                        importSource: (platformOptions && platformOptions.jsxImportSource) || 'react',
                    }),
                    // NOTE: Unexposed props:
                    // pragma?: string;
                    // pragmaFrag?: string;
                    // pure?: string;
                    // throwIfNamespace?: boolean;
                    // useBuiltIns?: boolean;
                    // useSpread?: boolean;
                },
            ],
        ],
        plugins: [
            ...extraPlugins,
            // TODO: Remove
            platformOptions.decorators !== false && [
                require('@babel/plugin-proposal-decorators'),
                platformOptions.decorators ?? { legacy: true },
            ],
            // Automatically add `react-native-reanimated/plugin` when the package is installed.
            // TODO: Move to be a customTransformOption.
            (0, common_1.hasModule)('react-native-reanimated') &&
                platformOptions.reanimated !== false && [require('react-native-reanimated/plugin')],
        ].filter(Boolean),
    };
}
exports.default = babelPresetExpo;
module.exports = babelPresetExpo;
