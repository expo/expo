"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const expo_router_plugin_1 = require("./expo-router-plugin");
const native_1 = require("./native");
const web_1 = require("./web");
function babelPresetExpo(api, options = {}) {
    const { reanimated } = options;
    const platform = api.caller(common_1.getPlatform);
    const isDev = api.caller(common_1.getIsDev);
    const plugins = [
        // TODO: Remove decorators
        [require('@babel/plugin-proposal-decorators'), { legacy: true }],
        require('@babel/plugin-proposal-export-namespace-from'),
    ];
    const aliasPlugin = getAliasPlugin();
    if (aliasPlugin) {
        plugins.push(aliasPlugin);
    }
    if (hasModule('expo-router')) {
        plugins.push(expo_router_plugin_1.expoRouterBabelPlugin);
    }
    // Automatically add `react-native-reanimated/plugin` when the package is installed.
    // TODO: Move to be a customTransformOption.
    if (hasModule('react-native-reanimated') && reanimated !== false) {
        plugins.push(require('react-native-reanimated/plugin'));
    }
    const platformOptions = platform === 'web' ? options.web : options.native;
    if (platformOptions?.useTransformReactJSXExperimental != null) {
        throw new Error(`babel-preset-expo: The option 'useTransformReactJSXExperimental' has been removed in favor of { jsxRuntime: 'classic' }.`);
    }
    return {
        presets: [
            [platform === 'web' ? web_1.babelPresetExpoWeb : native_1.babelPresetExpoNative, options],
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
                    runtime: options?.jsxRuntime || 'automatic',
                    ...(options &&
                        options.jsxRuntime !== 'classic' && {
                        importSource: (options && options.jsxImportSource) || 'react',
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
        plugins,
    };
}
function getAliasPlugin() {
    if (!hasModule('@expo/vector-icons')) {
        return null;
    }
    return [
        require.resolve('babel-plugin-module-resolver'),
        {
            alias: {
                'react-native-vector-icons': '@expo/vector-icons',
            },
        },
    ];
}
function hasModule(name) {
    try {
        return !!require.resolve(name);
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(name)) {
            return false;
        }
        throw error;
    }
}
exports.default = babelPresetExpo;
module.exports = babelPresetExpo;
