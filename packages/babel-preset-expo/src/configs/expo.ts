import type { ConfigAPI, PluginItem } from '@babel/core';
import type { PluginOptions as ReactCompilerOptions } from 'babel-plugin-react-compiler';

import { reactClientReferencesPlugin } from '../plugins/client-module-proxy-plugin';
import { environmentRestrictedImportsPlugin } from '../plugins/environment-restricted-imports';
import { expoInlineManifestPlugin } from '../plugins/expo-inline-manifest-plugin';
import { expoRouterBabelPlugin } from '../plugins/expo-router-plugin';
import { expoImportMetaTransformPluginFactory } from '../plugins/import-meta-transform-plugin';
import { expoInlineEnvVars } from '../plugins/inline-env-vars';
import { environmentRestrictedReactAPIsPlugin } from '../plugins/restricted-react-api-plugin';
import { reactServerActionsPlugin } from '../plugins/server-actions-plugin';
import { serverDataLoadersPlugin } from '../plugins/server-data-loaders-plugin';
import { serverMetadataPlugin } from '../plugins/server-metadata-plugin';
import { expoUseDomDirectivePlugin } from '../plugins/use-dom-directive-plugin';
import { widgetsPlugin } from '../plugins/widgets-plugin';
import { hasModule, resolveModule } from '../utils/resolveModule';

const EXCLUDED_FIRST_PARTY_PATHS = [/[/\\]node_modules[/\\]/];

export interface ExpoConfigOptions {
  platform: string | null;
  engine: string;
  isDev: boolean;
  isProduction: boolean;
  isServerEnv: boolean;
  isReactServer: boolean;
  isNodeModule: boolean;
  isFastRefreshEnabled: boolean;
  isReactCompilerEnabled: boolean;
  isModernEngine: boolean;
  baseUrl: string;
  bundler: 'metro' | 'webpack' | null;
  inlineEnvironmentVariables?: boolean;
  decorators: { legacy?: boolean; version?: number } | false | undefined;
  reanimated: boolean | undefined;
  worklets: boolean | undefined;
  expoUi: boolean | undefined;
  reactCompiler: ReactCompilerOptions | false | undefined;
  enableReactFastRefresh: boolean | undefined;
  minifyTypeofWindow: boolean | undefined;
  transformImportMeta: boolean | undefined;
  disableImportExportTransform: boolean | undefined;
  disableDeepImportWarnings: boolean | undefined;
  jsxRuntime: 'classic' | 'automatic' | undefined;
  jsxImportSource: string | undefined;
}

module.exports = function (api: ConfigAPI, options: ExpoConfigOptions) {
  const plugins: PluginItem[] = [];

  // React Native codegen for native module type generation (not needed on web/server).
  if (!options.isModernEngine) {
    plugins.push(getCodegenPlugin());
  }

  // Add compiler as soon as possible to prevent other plugins from modifying the code.
  const reactCompilerPlugin = getReactCompilerPlugin(options);
  if (reactCompilerPlugin != null) {
    plugins.push(reactCompilerPlugin);
  }

  // TODO(@kitten): Remove or add non-hermes config
  if (options.engine !== 'hermes') {
    // `@react-native/babel-preset` configures this plugin with `{ loose: true }`, which breaks all
    // getters and setters in spread objects. We need to add this plugin ourself without that option.
    // @see https://github.com/expo/expo/pull/11960#issuecomment-887796455
    plugins.push([
      require('@babel/plugin-transform-object-rest-spread'),
      // Assume no dependence on getters or evaluation order. See https://github.com/babel/babel/pull/11520
      { loose: true, useBuiltIns: true },
    ]);
  }

  const inlines = getInlinesFromOptions(options);
  plugins.push([require('../plugins/define-plugin'), inlines]);

  if (options.isProduction) {
    // Metro applies a version of this plugin too but it does it after the Platform modules have been transformed to CJS, this breaks the transform.
    // Here, we'll apply it before the commonjs transform, in production only, to ensure `Platform.OS` is replaced with a string literal.
    plugins.push([
      require('../plugins/minify-platform-select-plugin'),
      {
        platform: options.platform,
      },
    ]);
  }

  // Only apply in non-server, for metro-only, in production environments, when the user hasn't disabled the feature.
  // Webpack uses DefinePlugin for environment variables.
  // Development uses an uncached serializer.
  // Servers read from the environment.
  // Users who disable the feature may be using a different babel plugin.
  if (options.inlineEnvironmentVariables) {
    plugins.push(expoInlineEnvVars);
  }

  if (options.platform === 'web') {
    plugins.push(require('babel-plugin-react-native-web'));
  }
  // Webpack uses the DefinePlugin to provide the manifest to `expo-constants`.
  if (options.bundler !== 'webpack') {
    plugins.push(expoInlineManifestPlugin);
  }

  if (hasModule(api, 'expo-router/package.json')) {
    plugins.push(expoRouterBabelPlugin);
    plugins.push(serverMetadataPlugin);
    // Process `loader()` functions for client, loader and server bundles (excluding RSC)
    // - Client bundles: Remove loader exports, they run on server only
    // - Server bundles: Keep loader exports (needed for SSG)
    // - Loader-only bundles: Keep only loader exports, remove everything else
    if (!options.isReactServer) {
      plugins.push(serverDataLoadersPlugin);
    }
  }

  plugins.push(reactClientReferencesPlugin);

  // Ensure these only run when the user opts-in to bundling for a react server to prevent unexpected behavior for
  // users who are bundling using the client-only system.
  if (options.isReactServer) {
    plugins.push(reactServerActionsPlugin);
    plugins.push(environmentRestrictedReactAPIsPlugin);
  } else {
    // DOM components must run after "use client" and only in client environments.
    plugins.push(expoUseDomDirectivePlugin);
  }

  // This plugin is fine to run whenever as the server-only imports were introduced as part of RSC and shouldn't be used in any client code.
  plugins.push(environmentRestrictedImportsPlugin);

  // Transform widget component JSX expressions to capture widget components for native-side evaluation.
  // This enables the native side to re-evaluate widget components with updated props without re-sending the entire layout.
  if (hasModule(api, 'expo-widgets/package.json')) {
    plugins.push(widgetsPlugin);
  }

  const reactRefreshPlugin = getReactRefreshPlugin(options);
  if (reactRefreshPlugin != null) {
    plugins.push(reactRefreshPlugin);
  }

  if (options.disableImportExportTransform) {
    plugins.push([require('../plugins/detect-dynamic-exports').detectDynamicExports]);
  }

  const polyfillImportMeta = options.transformImportMeta !== false;
  plugins.push(expoImportMetaTransformPluginFactory(polyfillImportMeta === true));

  // TODO: Remove
  if (options.decorators !== false) {
    plugins.push([
      require('@babel/plugin-proposal-decorators'),
      options.decorators ?? { legacy: true },
    ]);
  }

  // Automatically add worklets or reanimated plugin when package is installed.
  if (options.worklets !== false && options.reanimated !== false) {
    const workletsPluginPath = resolveModule(api, 'react-native-worklets/plugin');
    if (workletsPluginPath) {
      plugins.push([require(workletsPluginPath)]);
    }
  } else if (options.reanimated !== false) {
    const reanimatedPluginPath = resolveModule(api, 'react-native-reanimated/plugin');
    if (reanimatedPluginPath) {
      plugins.push([require(reanimatedPluginPath)]);
    }
  }

  if (options.expoUi !== false) {
    const expoUiPluginPath = resolveModule(api, '@expo/ui/babel-plugin');
    if (expoUiPluginPath) {
      plugins.push([require(expoUiPluginPath)]);
    }
  }

  return {
    presets: [getReactPreset(options)],
    overrides: getDeepImportWarningsOverride(options),
    plugins,
  };
};

function getReactCompilerPlugin(options: {
  isReactCompilerEnabled?: boolean;
  isNodeModule?: boolean;
  isServerEnv: boolean;
  isProduction?: boolean;
  isDev?: boolean;
  reactCompiler?: false | ReactCompilerOptions;
}): PluginItem | null {
  if (
    !options.isReactCompilerEnabled ||
    // Don't run compiler on node modules, it can only safely be run on the user's code.
    options.isNodeModule ||
    // Only run for client code. It's unclear if compiler has any benefits for React Server Components.
    // NOTE: We might want to allow running it to prevent hydration errors.
    options.isServerEnv ||
    // Give users the ability to opt-out of the feature, per-platform.
    options.reactCompiler === false
  ) {
    return null;
  }

  const reactCompilerOptions = options.reactCompiler;
  const reactCompilerOptOutDirectives = new Set([
    // We need to opt-out for our widgets, since they're stringified functions that output Swift UI JSX
    'widget',
    // We need to manually include the default opt-out directives, since they get overridden
    // See:
    // - https://github.com/facebook/react/blob/e0cc720/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Program.ts#L48C1-L48C77
    // - https://github.com/facebook/react/blob/e0cc720/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Program.ts#L69-L86
    'use no memo',
    'use no forget',
    // Add the user's override but preserve defaults above to avoid the pitfall of them being removed
    ...(reactCompilerOptions?.customOptOutDirectives ?? []),
  ]);

  return [
    require('babel-plugin-react-compiler'),
    {
      target: '19',
      environment: {
        enableResetCacheOnSourceFileChanges: !options.isProduction,
        ...(reactCompilerOptions?.environment ?? {}),
      },
      panicThreshold: options.isDev ? undefined : 'NONE',
      ...reactCompilerOptions,
      // See: https://github.com/facebook/react/blob/074d96b/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L160-L163
      customOptOutDirectives: [...reactCompilerOptOutDirectives],
    },
  ];
}

function getReactRefreshPlugin(options: {
  enableReactFastRefresh?: boolean;
  isFastRefreshEnabled?: boolean;
}): PluginItem | null {
  if (
    !options.enableReactFastRefresh &&
    (!options.isFastRefreshEnabled || options.enableReactFastRefresh === false)
  ) {
    return null;
  } else {
    return [
      require('react-refresh/babel'),
      {
        // We perform the env check to enable `isFastRefreshEnabled`, unless the plugin is force-enabled
        skipEnvCheck: options.enableReactFastRefresh !== true,
      },
    ];
  }
}

function getCodegenPlugin(): PluginItem {
  return [require('@react-native/babel-plugin-codegen'), {}, 'react-native-codegen'];
}

function getDeepImportWarningsOverride(options: {
  isDev?: boolean;
  disableDeepImportWarnings?: boolean;
}) {
  if (!options.isDev || options.disableDeepImportWarnings) {
    return [];
  }
  return [
    {
      test: (fileName: string | undefined | null) =>
        !!fileName && !EXCLUDED_FIRST_PARTY_PATHS.some((regex) => regex.test(fileName)),
      plugins: [[require('../plugins/plugin-warn-on-deep-imports')]] as PluginItem[],
    },
  ];
}

function getReactPreset(options: {
  isDev?: boolean;
  jsxRuntime?: 'classic' | 'automatic';
  jsxImportSource?: string;
}): [any, Record<string, any>] {
  return [
    require('@babel/preset-react'),
    {
      development: options.isDev,

      // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
      runtime: options.jsxRuntime || 'automatic',
      ...(options.jsxRuntime !== 'classic' && {
        importSource: options.jsxImportSource || 'react',
      }),
    },
  ];
}

function getInlinesFromOptions(
  options: ExpoConfigOptions
): Record<string, undefined | null | boolean | string> {
  const inlines: Record<string, undefined | null | boolean | string> = {
    'process.env.EXPO_OS': options.platform,
    // 'typeof document': isServerEnv ? 'undefined' : 'object',
    'process.env.EXPO_SERVER': !!options.isServerEnv,
  };

  // `typeof window` is left in place for native + client environments.
  // NOTE(@kitten): We're temporarily disabling this default optimization for Web targets due to Web Workers
  // We're currently not passing metadata to indicate we're transforming for a Web Worker to disable this automatically
  const minifyTypeofWindow = options.minifyTypeofWindow ?? options.isServerEnv;
  if (minifyTypeofWindow !== false) {
    // This nets out slightly faster in development when considering the cost of bundling server dependencies.
    inlines['typeof window'] = options.isServerEnv ? 'undefined' : 'object';
  }

  if (options.isProduction) {
    inlines['process.env.NODE_ENV'] = 'production';
    inlines['__DEV__'] = false;
    inlines['Platform.OS'] = options.platform;
  }

  if (process.env.NODE_ENV !== 'test') {
    inlines['process.env.EXPO_BASE_URL'] = options.baseUrl;
  }

  return inlines;
}
