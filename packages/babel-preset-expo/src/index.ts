import { ConfigAPI, PluginItem, TransformOptions } from '@babel/core';

import { BabelPresetExpoOptions, getIsDev, getPlatform } from './common';
import { expoRouterBabelPlugin } from './expo-router-plugin';
import { babelPresetExpoNative } from './native';
import { babelPresetExpoWeb } from './web';

function babelPresetExpo(api: ConfigAPI, options: BabelPresetExpoOptions = {}): TransformOptions {
  const { reanimated } = options;
  const platform = api.caller(getPlatform);
  const isDev = api.caller(getIsDev);

  const plugins: PluginItem[] = [
    // TODO: Remove decorators
    [require('@babel/plugin-proposal-decorators'), { legacy: true }],
    require('@babel/plugin-transform-export-namespace-from'),
  ];

  const aliasPlugin = getAliasPlugin();
  if (aliasPlugin) {
    plugins.push(aliasPlugin);
  }

  if (hasModule('expo-router')) {
    plugins.push(expoRouterBabelPlugin);
  }

  // Automatically add `react-native-reanimated/plugin` when the package is installed.
  // TODO: Move to be a customTransformOption.
  if (hasModule('react-native-reanimated') && reanimated !== false) {
    plugins.push(require('react-native-reanimated/plugin'));
  }

  const platformOptions = platform === 'web' ? options.web : options.native;

  if (platformOptions?.useTransformReactJSXExperimental != null) {
    throw new Error(
      `babel-preset-expo: The option 'useTransformReactJSXExperimental' has been removed in favor of { jsxRuntime: 'classic' }.`
    );
  }

  return {
    presets: [
      [platform === 'web' ? babelPresetExpoWeb : babelPresetExpoNative, options],

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
          runtime: options.jsxRuntime ?? 'automatic',
          ...(options.jsxRuntime !== 'classic'
            ? {
                importSource: options.jsxImportSource ?? 'react',
              }
            : {}),

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

function getAliasPlugin(): PluginItem | null {
  if (!hasModule('@expo/vector-icons')) {
    return null;
  }
  return [
    require('babel-plugin-module-resolver'),
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
