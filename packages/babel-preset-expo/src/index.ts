import { ConfigAPI, PluginItem, TransformOptions } from '@babel/core';

import { BabelPresetExpoOptions, getPlatform } from './common';
import { babelPresetExpoNative } from './native';
import { babelPresetExpoWeb } from './web';

function babelPresetExpo(api: ConfigAPI, options: BabelPresetExpoOptions = {}): TransformOptions {
  const { reanimated } = options;
  const platform = api.caller(getPlatform);

  const plugins: PluginItem[] = [
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
    presets: [[platform === 'web' ? babelPresetExpoWeb : babelPresetExpoNative, options]],
    plugins,
  };
}

function getAliasPlugin(): PluginItem | null {
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

function hasModule(name: string): boolean {
  try {
    return !!require.resolve(name);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(name)) {
      return false;
    }
    throw error;
  }
}

export default babelPresetExpo;
module.exports = babelPresetExpo;
