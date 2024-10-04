import { ConfigAPI, PluginItem, TransformOptions } from '@babel/core';

import { getBundler, getIsDev, hasModule } from './common';
import { expoInlineManifestPlugin } from './expo-inline-manifest-plugin';
import { expoRouterBabelPlugin } from './expo-router-plugin';
import { lazyImports } from './lazyImports';

type BabelPresetExpoPlatformOptions = {
  /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
  useTransformReactJSXExperimental?: boolean;
  disableImportExportTransform?: boolean;
  // Defaults to undefined, set to `true` to disable `@babel/plugin-transform-flow-strip-types`
  disableFlowStripTypesTransform?: boolean;
  // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
  enableBabelRuntime?: boolean;
  // Defaults to `'default'`, can also use `'hermes-canary'`
  unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
};

export type BabelPresetExpoOptions = {
  lazyImports?: boolean;
  reanimated?: boolean;
  jsxRuntime?: 'classic' | 'automatic';
  jsxImportSource?: string;
  web?: BabelPresetExpoPlatformOptions;
  native?: BabelPresetExpoPlatformOptions;
};

function babelPresetExpo(api: ConfigAPI, options: BabelPresetExpoOptions = {}): TransformOptions {
  const { web = {}, native = {}, reanimated } = options;

  const bundler = api.caller(getBundler);
  const isWebpack = bundler === 'webpack';
  let platform = api.caller((caller) => (caller as any)?.platform);
  const engine = api.caller((caller) => (caller as any)?.engine) ?? 'default';
  const isDev = api.caller(getIsDev);

  // If the `platform` prop is not defined then this must be a custom config that isn't
  // defining a platform in the babel-loader. Currently this may happen with Next.js + Expo web.
  if (!platform && isWebpack) {
    platform = 'web';
  }

  const platformOptions: BabelPresetExpoPlatformOptions =
    platform === 'web'
      ? {
          // Only disable import/export transform when Webpack is used because
          // Metro does not support tree-shaking.
          disableImportExportTransform: isWebpack,
          unstable_transformProfile: engine === 'hermes' ? 'hermes-stable' : 'default',
          ...web,
        }
      : {
          disableImportExportTransform: false,
          unstable_transformProfile: engine === 'hermes' ? 'hermes-stable' : 'default',
          ...native,
        };

  // Note that if `options.lazyImports` is not set (i.e., `null` or `undefined`),
  // `metro-react-native-babel-preset` will handle it.
  const lazyImportsOption = options?.lazyImports;

  const extraPlugins: PluginItem[] = [];

  if (engine !== 'hermes') {
    // `metro-react-native-babel-preset` configures this plugin with `{ loose: true }`, which breaks all
    // getters and setters in spread objects. We need to add this plugin ourself without that option.
    // @see https://github.com/expo/expo/pull/11960#issuecomment-887796455
    extraPlugins.push([
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      { loose: false },
    ]);
  }

  if (platformOptions.useTransformReactJSXExperimental != null) {
    throw new Error(
      `babel-preset-expo: The option 'useTransformReactJSXExperimental' has been removed in favor of { jsxRuntime: 'classic' }.`
    );
  }

  const aliasPlugin = getAliasPlugin();
  if (aliasPlugin) {
    extraPlugins.push(aliasPlugin);
  }

  if (platform === 'web') {
    extraPlugins.push(require.resolve('babel-plugin-react-native-web'));

    // Webpack uses the DefinePlugin to provide the manifest to `expo-constants`.
    if (bundler !== 'webpack') {
      extraPlugins.push(expoInlineManifestPlugin);
    }
  }

  if (hasModule('expo-router')) {
    extraPlugins.push(expoRouterBabelPlugin);
  }

  return {
    presets: [
      [
        // We use `require` here instead of directly using the package name because we want to
        // specifically use the `metro-react-native-babel-preset` installed by this package (ex:
        // `babel-preset-expo/node_modules/`). This way the preset will not change unintentionally.
        // Reference: https://github.com/expo/expo/pull/4685#discussion_r307143920
        require('metro-react-native-babel-preset'),
        {
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
          lazyImportExportTransform:
            lazyImportsOption === true
              ? (importModuleSpecifier: string) => {
                  // Do not lazy-initialize packages that are local imports (similar to `lazy: true`
                  // behavior) or are in the blacklist.
                  return !(
                    importModuleSpecifier.includes('./') || lazyImports.has(importModuleSpecifier)
                  );
                }
              : // Pass the option directly to `metro-react-native-babel-preset`, which in turn
                // passes it to `babel-plugin-transform-modules-commonjs`
                lazyImportsOption,
        },
      ],

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

    plugins: [
      ...extraPlugins,
      // TODO: Remove
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      require.resolve('@babel/plugin-transform-export-namespace-from'),
      // Automatically add `react-native-reanimated/plugin` when the package is installed.
      // TODO: Move to be a customTransformOption.
      hasModule('react-native-reanimated') &&
        reanimated !== false && [require.resolve('react-native-reanimated/plugin')],
    ].filter(Boolean) as PluginItem[],
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

export default babelPresetExpo;
module.exports = babelPresetExpo;
