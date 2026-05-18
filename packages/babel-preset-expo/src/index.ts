import type { ConfigAPI, TransformOptions } from '@babel/core';
import type { PluginOptions as ReactCompilerOptions } from 'babel-plugin-react-compiler';

import {
  getBabelRuntimeVersion,
  getBaseUrl,
  getBundler,
  getInlineEnvVarsEnabled,
  getIsDev,
  getIsDomComponent,
  getIsFastRefreshEnabled,
  getIsNodeModule,
  getIsProd,
  getIsReactServer,
  getIsServer,
  getReactCompiler,
  getMetroSourceType,
  getStaticESM,
  getPlatform,
  getEngine,
} from './common';
import { ExpoConfigOptions } from './configs/expo';
import { getConfig as getFlowConfig } from './configs/flow';
import { HermesV0ConfigOptions } from './configs/hermes-v0';
import { HermesV1ConfigOptions } from './configs/hermes-v1';
import { ModuleTransformOptions } from './configs/module-transforms';
import { syntaxPlugins } from './configs/syntax';
import { getConfig as getTypeScriptConfig } from './configs/typescript';
import { WebConfigOptions } from './configs/web';
import { WebviewConfigOptions } from './configs/webview';

interface BabelPresetExpoPlatformOptions {
  /** Disable or configure the `@babel/plugin-proposal-decorators` plugin. */
  decorators?: false | { legacy?: boolean; version?: number };
  /** Enable or disable adding the Reanimated plugin by default. @default `true` */
  reanimated?: boolean;
  /** Enable or disable adding the Worklets plugin by default. Only applies when
   * using `react-native-worklets` or Reanimated 4. @default `true`
   */
  worklets?: boolean;
  /** Enable or disable adding the `@expo/ui` Babel plugin when `@expo/ui` is
   * installed. The plugin rewrites `Icon.select({ ios, android })` to the
   * active platform's value (read from the babel caller) so per-platform
   * bundles only carry their own branch. @default `true`
   */
  expoUi?: boolean;
  /** Change the policy for handling JSX in a file. Passed to `plugin-transform-react-jsx`. @default `'automatic'` */
  jsxRuntime?: 'classic' | 'automatic';
  /** Change the source module ID to use when importing an automatic JSX import. Only applied when `jsxRuntime` is `'automatic'` (default). Passed to `plugin-transform-react-jsx`. @default `'react'` */
  jsxImportSource?: string;

  lazyImports?: boolean;

  disableImportExportTransform?: boolean;

  disableDeepImportWarnings?: boolean;

  // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
  enableBabelRuntime?: boolean | string;
  // Defaults to `'default'`, can also use `'hermes-canary'`
  unstable_transformProfile?: 'default' | 'hermes-v0' | 'hermes-stable' | 'hermes-canary';

  /** Settings to pass to `babel-plugin-react-compiler`. Set as `false` to disable the plugin. */
  'react-compiler'?: false | ReactCompilerOptions;

  /** Only set to `false` to disable `react-refresh/babel` forcefully, defaults to `undefined` */
  enableReactFastRefresh?: boolean;

  /** Enable `typeof window` runtime checks. The default behavior is to minify `typeof window` on web clients to `"object"` and `"undefined"` on servers. */
  minifyTypeofWindow?: boolean;

  /**
   * Enable that transform that converts `import.meta` to `globalThis.__ExpoImportMetaRegistry`.
   *
   * > **Note:** If the JavaScript engine supports `import.meta` natively, this transformation may interfere with the native implementation.
   *
   * @default `true`
   */
  transformImportMeta?: boolean;
}

export interface BabelPresetExpoOptions extends BabelPresetExpoPlatformOptions {
  /** Web-specific settings. */
  web?: BabelPresetExpoPlatformOptions;
  /** Native-specific settings. */
  native?: BabelPresetExpoPlatformOptions;
}

function getOptions(
  options: BabelPresetExpoOptions,
  platform: string | null
): BabelPresetExpoPlatformOptions {
  const tag = platform === 'web' ? 'web' : 'native';

  return {
    ...options,
    ...options[tag],
  };
}

function babelPresetExpo(api: ConfigAPI, options: BabelPresetExpoOptions = {}): TransformOptions {
  const bundler = api.caller(getBundler);
  const isWebpack = bundler === 'webpack';
  const platform = api.caller(getPlatform);
  const engine = api.caller(getEngine);
  const isDev = api.caller(getIsDev);
  const isNodeModule = api.caller(getIsNodeModule);
  const isServer = api.caller(getIsServer);
  const isReactServer = api.caller(getIsReactServer);
  const isFastRefreshEnabled = api.caller(getIsFastRefreshEnabled);
  const isReactCompilerEnabled = api.caller(getReactCompiler);
  const isDomComponent = api.caller(getIsDomComponent);
  const metroSourceType = api.caller(getMetroSourceType);
  const baseUrl = api.caller(getBaseUrl);
  const supportsStaticESM = api.caller(getStaticESM);
  const isServerEnv = isServer || isReactServer;

  // Unlike `isDev`, this will be `true` when the bundler is explicitly set to `production`,
  // i.e. `false` when testing, development, or used with a bundler that doesn't specify the correct inputs.
  const isProduction = api.caller(getIsProd);
  const inlineEnvironmentVariables = api.caller(getInlineEnvVarsEnabled);

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
    } else {
      platformOptions.disableImportExportTransform = supportsStaticESM ?? false;
    }
  }

  if (platformOptions.unstable_transformProfile == null && !isDomComponent) {
    platformOptions.unstable_transformProfile = engine === 'hermes' ? 'hermes-stable' : 'default';
  }

  // Defaults to Babel caller's `babelRuntimeVersion` or the version of `@babel/runtime` for this package's peer
  // Set to `false` to disable `@babel/plugin-transform-runtime`
  const enableBabelRuntime =
    platformOptions.enableBabelRuntime == null || platformOptions.enableBabelRuntime === true
      ? api.caller(getBabelRuntimeVersion)
      : platformOptions.enableBabelRuntime;

  // Compute config fragments from helper modules to compose into the presets below.
  const flowFragment = getFlowConfig({ disableFlowStripTypesTransform: false });
  const tsFragment = getTypeScriptConfig();
  return {
    // Top-level overrides run before sub-preset plugins.
    // Flow/TypeScript type stripping must run before class-properties in the env configs.
    overrides: [...flowFragment.overrides, ...tsFragment.overrides],
    plugins: [...syntaxPlugins, ...flowFragment.plugins],
    presets: [
      // Module transforms preset is first so it runs last (Babel reverses preset order).
      // This ensures import/export transforms run after all other plugins have processed the code.
      [
        require('./configs/module-transforms'),
        {
          enableBabelRuntime,
          disableImportExportTransform: platformOptions.disableImportExportTransform,
          lazyImportExportTransform: platformOptions.lazyImports,
        } satisfies ModuleTransformOptions,
      ],

      (() => {
        const presetOpts = { dev: isDev };

        if (isDomComponent) {
          return [require('./configs/webview'), presetOpts satisfies WebviewConfigOptions];
        } else if (isModernEngine) {
          return [require('./configs/web'), presetOpts satisfies WebConfigOptions];
        }

        // Select the hermes config based on `unstable_transformProfile`, which is derived from
        // the caller's `engine` property or overridden by the user.
        switch (platformOptions.unstable_transformProfile) {
          case 'hermes-stable':
          case 'hermes-canary':
            return [require('./configs/hermes-v1'), presetOpts satisfies HermesV1ConfigOptions];
          case 'hermes-v0':
          default:
            return [require('./configs/hermes-v0'), presetOpts satisfies HermesV0ConfigOptions];
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
        } satisfies ExpoConfigOptions,
      ],
    ],
  };
}

export default babelPresetExpo;
module.exports = babelPresetExpo;
