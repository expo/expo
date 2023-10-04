"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const native_1 = require("./native");
const web_1 = require("./web");
function babelPresetExpo(api, options = {}) {
    const { reanimated } = options;
    const platform = api.caller(common_1.getPlatform);
    const extraPlugins = [];
    const aliasPlugin = getAliasPlugin();
    if (aliasPlugin) {
        extraPlugins.push(aliasPlugin);
    }
    return {
        presets: [[platform === 'web' ? web_1.babelPresetExpoWeb : native_1.babelPresetExpoNative, options]],
        plugins: [
            ...extraPlugins,
            // TODO: Remove
            [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
            require.resolve('@babel/plugin-proposal-export-namespace-from'),
            // Automatically add `react-native-reanimated/plugin` when the package is installed.
            // TODO: Move to be a customTransformOption.
            hasModule('react-native-reanimated') &&
                reanimated !== false && [require.resolve('react-native-reanimated/plugin')],
        ].filter(Boolean),
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
