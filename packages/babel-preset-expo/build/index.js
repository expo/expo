"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const native_1 = require("./native");
const web_1 = require("./web");
function babelPresetExpo(api, options = {}) {
    const { reanimated } = options;
    const platform = api.caller(common_1.getPlatform);
    const plugins = [
        // TODO: Remove decorators
        [require('@babel/plugin-proposal-decorators'), { legacy: true }],
        require('@babel/plugin-proposal-export-namespace-from'),
    ];
    const aliasPlugin = getAliasPlugin();
    if (aliasPlugin) {
        plugins.push(aliasPlugin);
    }
    // Automatically add `react-native-reanimated/plugin` when the package is installed.
    // TODO: Move to be a customTransformOption.
    if (hasModule('react-native-reanimated') && reanimated !== false) {
        plugins.push(require('react-native-reanimated/plugin'));
    }
    return {
        presets: [[platform === 'web' ? web_1.babelPresetExpoWeb : native_1.babelPresetExpoNative, options]],
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
