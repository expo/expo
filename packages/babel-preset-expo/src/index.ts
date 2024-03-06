import { ConfigAPI, PluginItem, TransformOptions } from '@babel/core';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

import { reactClientReferencesPlugin } from './client-module-proxy-plugin';
import {
  getBaseUrl,
  getBundler,
  getInlineEnvVarsEnabled,
  getIsDev,
  getIsFastRefreshEnabled,
  getIsNodeModule,
  getIsProd,
  getIsReactServer,
  getPossibleProjectRoot,
  hasModule,
} from './common';
import { environmentRestrictedImportsPlugin } from './environment-restricted-imports';
import { expoInlineManifestPlugin } from './expo-inline-manifest-plugin';
import { expoRouterBabelPlugin } from './expo-router-plugin';
import { expoInlineEnvVars, expoInlineTransformEnvVars } from './inline-env-vars';
import { lazyImports } from './lazyImports';
import { environmentRestrictedReactAPIsPlugin } from './restricted-react-api-plugin';

type BabelPresetExpoPlatformOptions = {
  /** Enable or disable adding the Reanimated plugin by default. @default `true` */
  reanimated?: boolean;
  /** @deprecated Set `jsxRuntime: 'classic'` to disable automatic JSX handling.  */
  useTransformReactJSXExperimental?: boolean;
  /** Change the policy for handling JSX in a file. Passed to `plugin-transform-react-jsx`. @default `'automatic'` */
  jsxRuntime?: 'classic' | 'automatic';
  /** Change the source module ID to use when importing an automatic JSX import. Only applied when `jsxRuntime` is `'automatic'` (default). Passed to `plugin-transform-react-jsx`. @default `'react'` */
  jsxImportSource?: string;

  lazyImports?: boolean;

  disableImportExportTransform?: boolean;

  // Defaults to undefined, set to `true` to disable `@babel/plugin-transform-flow-strip-types`
  disableFlowStripTypesTransform?: boolean;
  // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
  enableBabelRuntime?: boolean;
  // Defaults to `'default'`, can also use `'hermes-canary'`
  unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';

  'babel-plugin-react-forget'?:
    | false
    | {
        // TODO: Add full types and doc blocks.
        enableUseMemoCachePolyfill?: boolean;
        compilationMode?: 'infer' | 'strict';
        panicThreshold?: 'NONE' | 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
        logger?: {};
      };
};

export type BabelPresetExpoOptions = BabelPresetExpoPlatformOptions & {
  /** Web-specific settings. */
  web?: BabelPresetExpoPlatformOptions;
  /** Native-specific settings. */
  native?: BabelPresetExpoPlatformOptions;
};

function getOptions(
  options: BabelPresetExpoOptions,
  platform?: string
): BabelPresetExpoPlatformOptions {
  const tag = platform === 'web' ? 'web' : 'native';

  return {
    ...options,
    ...options[tag],
  };
}

function babelPresetExpo(api: ConfigAPI, options: BabelPresetExpoOptions = {}): TransformOptions {
  const bundler = api.caller(getBundler);
  const projectRoot = api.caller(getPossibleProjectRoot);
  const isWebpack = bundler === 'webpack';
  let platform = api.caller((caller) => (caller as any)?.platform);
  const engine = api.caller((caller) => (caller as any)?.engine) ?? 'default';
  const isDev = api.caller(getIsDev);
  const isNodeModule = api.caller(getIsNodeModule);
  const isReactServer = api.caller(getIsReactServer);
  const isFastRefreshEnabled = api.caller(getIsFastRefreshEnabled);
  const baseUrl = api.caller(getBaseUrl);
  const supportsStaticESM: boolean | undefined = api.caller(
    (caller) => (caller as any)?.supportsStaticESM
  );

  // Unlike `isDev`, this will be `true` when the bundler is explicitly set to `production`,
  // i.e. `false` when testing, development, or used with a bundler that doesn't specify the correct inputs.
  const isProduction = api.caller(getIsProd);
  const inlineEnvironmentVariables = api.caller(getInlineEnvVarsEnabled);

  // If the `platform` prop is not defined then this must be a custom config that isn't
  // defining a platform in the babel-loader. Currently this may happen with Next.js + Expo web.
  if (!platform && isWebpack) {
    platform = 'web';
  }

  const platformOptions = getOptions(options, platform);

  if (platformOptions.disableImportExportTransform == null) {
    if (platform === 'web') {
      // Only disable import/export transform when Webpack is used because
      // Metro does not support tree-shaking.
      platformOptions.disableImportExportTransform = supportsStaticESM ?? isWebpack;
    } else {
      platformOptions.disableImportExportTransform = supportsStaticESM ?? false;
    }
  }

  if (platformOptions.unstable_transformProfile == null) {
    platformOptions.unstable_transformProfile = engine === 'hermes' ? 'hermes-stable' : 'default';
  }

  // Note that if `options.lazyImports` is not set (i.e., `null` or `undefined`),
  // `@react-native/babel-preset` will handle it.
  const lazyImportsOption = platformOptions?.lazyImports;

  const extraPlugins: PluginItem[] = [];

  // Add compiler as soon as possible to prevent other plugins from modifying the code.
  if (
    // Don't run compiler on node modules, it can only safely be run on the user's code.
    !isNodeModule &&
    // Only run for client code. It's unclear if compiler has any benefits for React Server Components.
    !isReactServer &&
    // Give users the ability to opt-out of the feature, per-platform.
    platformOptions['babel-plugin-react-forget'] !== false &&
    // Opt-in for now...
    !!platformOptions['babel-plugin-react-forget']
  ) {
    extraPlugins.push([
      require('babel-plugin-react-forget'),
      {
        // TODO: This isn't needed after React 19 apparently.
        enableUseMemoCachePolyfill: true,
        compilationMode: 'infer',
        panicThreshold: 'NONE',
        logger: {
          logEvent: (filename: string, event: any) => {
            let relativeFilename = projectRoot ? path.relative(projectRoot, filename) : filename;

            if (event.kind === 'CompileError') {
              // e.g. (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration
              if (event.detail.severity === 'Todo') {
                return;
              }
              // "InvalidJS",
              // "InvalidReact",
              // "InvalidConfig",
              // "Todo",
              // "Invariant"

              const icon = `[${event.detail.severity}]`;
              const pathWithPrefix = chalk`${icon} {dim ${relativeFilename}}`;
              const { codeFrameColumns } = require('@babel/code-frame');
              console.log(
                pathWithPrefix +
                  '\n\n' +
                  codeFrameColumns(fs.readFileSync(filename, 'utf8'), event.detail.loc, {
                    forceColor: true,
                    message: event.detail.reason,
                  })
              );
            } else if (event.kind === 'CompileSuccess') {
              if (event.memoSlots > 0 || event.memoBlocks > 0) {
                console.log(
                  // NOTE: fnName won't be defined if the function is anonymous or an arrow function.
                  chalk`✅ Optimized {bold ${
                    event.fnName ?? '[anonymous]'
                  }} {dim (${relativeFilename}:${event.fnLoc.start.line}:${
                    event.fnLoc.start.column
                  })}`
                );
              }
            } else {
              console.log(filename, event);
            }
          },
          ...platformOptions['babel-plugin-react-forget']?.logger,
        },
        ...platformOptions['babel-plugin-react-forget'],
      },
    ]);
  }

  if (engine !== 'hermes') {
    // `@react-native/babel-preset` configures this plugin with `{ loose: true }`, which breaks all
    // getters and setters in spread objects. We need to add this plugin ourself without that option.
    // @see https://github.com/expo/expo/pull/11960#issuecomment-887796455
    extraPlugins.push([require('@babel/plugin-transform-object-rest-spread'), { loose: false }]);
  } else {
    // This is added back on hermes to ensure the react-jsx-dev plugin (`@babel/preset-react`) works as expected when
    // JSX is used in a function body. This is technically not required in production, but we
    // should retain the same behavior since it's hard to debug the differences.
    extraPlugins.push(require('@babel/plugin-transform-parameters'));
  }

  if (isProduction && hasModule('metro-transform-plugins')) {
    // Metro applies this plugin too but it does it after the imports have been transformed which breaks
    // the plugin. Here, we'll apply it before the commonjs transform, in production, to ensure `Platform.OS`
    // is replaced with a string literal and `__DEV__` is converted to a boolean.
    // Applying early also means that web can be transformed before the `react-native-web` transform mutates the import.
    extraPlugins.push([
      require('metro-transform-plugins/src/inline-plugin.js'),
      {
        dev: isDev,
        inlinePlatform: true,
        platform,
      },
    ]);
  }

  if (platformOptions.useTransformReactJSXExperimental != null) {
    throw new Error(
      `babel-preset-expo: The option 'useTransformReactJSXExperimental' has been removed in favor of { jsxRuntime: 'classic' }.`
    );
  }

  // Allow jest tests to redefine the environment variables.
  if (process.env.NODE_ENV !== 'test') {
    extraPlugins.push([
      expoInlineTransformEnvVars,
      {
        // These values should not be prefixed with `EXPO_PUBLIC_`, so we don't
        // squat user-defined environment variables.
        EXPO_BASE_URL: baseUrl,
      },
    ]);
  }

  // Only apply in non-server, for metro-only, in production environments, when the user hasn't disabled the feature.
  // Webpack uses DefinePlugin for environment variables.
  // Development uses an uncached serializer.
  // Servers read from the environment.
  // Users who disable the feature may be using a different babel plugin.
  if (inlineEnvironmentVariables) {
    extraPlugins.push(expoInlineEnvVars);
  }

  if (platform === 'web') {
    extraPlugins.push(require('babel-plugin-react-native-web'));

    // Webpack uses the DefinePlugin to provide the manifest to `expo-constants`.
    if (bundler !== 'webpack') {
      extraPlugins.push(expoInlineManifestPlugin);
    }
  }

  if (hasModule('expo-router')) {
    extraPlugins.push(expoRouterBabelPlugin);
  }

  // Ensure these only run when the user opts-in to bundling for a react server to prevent unexpected behavior for
  // users who are bundling using the client-only system.
  if (isReactServer) {
    extraPlugins.push(reactClientReferencesPlugin);

    extraPlugins.push(environmentRestrictedReactAPIsPlugin);
  }

  // This plugin is fine to run whenever as the server-only imports were introduced as part of RSC and shouldn't be used in any client code.
  extraPlugins.push(environmentRestrictedImportsPlugin);

  if (isFastRefreshEnabled) {
    extraPlugins.push([
      require('react-refresh/babel'),
      {
        // We perform the env check to enable `isFastRefreshEnabled`.
        skipEnvCheck: true,
      },
    ]);
  }

  return {
    presets: [
      [
        // We use `require` here instead of directly using the package name because we want to
        // specifically use the `@react-native/babel-preset` installed by this package (ex:
        // `babel-preset-expo/node_modules/`). This way the preset will not change unintentionally.
        // Reference: https://github.com/expo/expo/pull/4685#discussion_r307143920
        require('@react-native/babel-preset'),
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
              : // Pass the option directly to `@react-native/babel-preset`, which in turn
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
      [require('@babel/plugin-proposal-decorators'), { legacy: true }],
      require('@babel/plugin-transform-export-namespace-from'),
      // Automatically add `react-native-reanimated/plugin` when the package is installed.
      // TODO: Move to be a customTransformOption.
      hasModule('react-native-reanimated') &&
        platformOptions.reanimated !== false && [require('react-native-reanimated/plugin')],
    ].filter(Boolean) as PluginItem[],
  };
}

export default babelPresetExpo;
module.exports = babelPresetExpo;
