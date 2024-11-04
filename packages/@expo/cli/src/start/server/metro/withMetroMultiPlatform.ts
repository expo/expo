/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, Platform } from '@expo/config';
import fs from 'fs';
import Bundler from 'metro/src/Bundler';
import { ConfigT } from 'metro-config';
import { Resolution, ResolutionContext, CustomResolutionContext } from 'metro-resolver';
import * as metroResolver from 'metro-resolver';
import path from 'path';
import resolveFrom from 'resolve-from';

import { createFastResolver, FailedToResolvePathError } from './createExpoMetroResolver';
import { isNodeExternal, shouldCreateVirtualCanary, shouldCreateVirtualShim } from './externals';
import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import { getMetroBundlerWithVirtualModules } from './metroVirtualModules';
import {
  withMetroErrorReportingResolver,
  withMetroMutatedResolverContext,
  withMetroResolvers,
} from './withMetroResolvers';
import { Log } from '../../../log';
import { FileNotifier } from '../../../utils/FileNotifier';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';
import { isInteractive } from '../../../utils/interactive';
import { loadTsConfigPathsAsync, TsConfigPaths } from '../../../utils/tsconfig/loadTsConfigPaths';
import { resolveWithTsConfigPaths } from '../../../utils/tsconfig/resolveWithTsConfigPaths';
import { isServerEnvironment } from '../middleware/metroOptions';
import { PlatformBundlers } from '../platformBundlers';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const ASSET_REGISTRY_SRC = `const assets=[];module.exports={registerAsset:s=>assets.push(s),getAssetByID:s=>assets[s-1]};`;

const debug = require('debug')('expo:start:server:metro:multi-platform') as typeof console.log;

function withWebPolyfills(
  config: ConfigT,
  {
    getMetroBundler,
  }: {
    getMetroBundler: () => Bundler;
  }
): ConfigT {
  const originalGetPolyfills = config.serializer.getPolyfills
    ? config.serializer.getPolyfills.bind(config.serializer)
    : () => [];

  const getPolyfills = (ctx: { platform?: string | null }): readonly string[] => {
    const virtualEnvVarId = `\0polyfill:environment-variables`;

    getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
      virtualEnvVarId,
      (() => {
        return `//`;
      })()
    );

    const virtualModuleId = `\0polyfill:external-require`;

    getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
      virtualModuleId,
      (() => {
        if (ctx.platform === 'web') {
          return `global.$$require_external = typeof window === "undefined" ? require : () => null;`;
        } else {
          // Wrap in try/catch to support Android.
          return 'try { global.$$require_external = typeof expo === "undefined" ? require : (moduleId) => { throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);} } catch { global.$$require_external = (moduleId) => { throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);} }';
        }
      })()
    );

    if (ctx.platform === 'web') {
      return [
        virtualModuleId,
        virtualEnvVarId,
        // Ensure that the error-guard polyfill is included in the web polyfills to
        // make metro-runtime work correctly.
        // TODO: This module is pretty big for a function that simply re-throws an error that doesn't need to be caught.
        require.resolve('@react-native/js-polyfills/error-guard'),
      ];
    }

    // Generally uses `rn-get-polyfills`
    const polyfills = originalGetPolyfills(ctx);
    return [...polyfills, virtualModuleId, virtualEnvVarId];
  };

  return {
    ...config,
    serializer: {
      ...config.serializer,
      getPolyfills,
    },
  };
}

function normalizeSlashes(p: string) {
  return p.replace(/\\/g, '/');
}

export function getNodejsExtensions(srcExts: readonly string[]): string[] {
  const mjsExts = srcExts.filter((ext) => /mjs$/.test(ext));
  const nodejsSourceExtensions = srcExts.filter((ext) => !/mjs$/.test(ext));
  // find index of last `*.js` extension
  const jsIndex = nodejsSourceExtensions.reduce((index, ext, i) => {
    return /jsx?$/.test(ext) ? i : index;
  }, -1);

  // insert `*.mjs` extensions after `*.js` extensions
  nodejsSourceExtensions.splice(jsIndex + 1, 0, ...mjsExts);

  return nodejsSourceExtensions;
}

/**
 * Apply custom resolvers to do the following:
 * - Disable `.native.js` extensions on web.
 * - Alias `react-native` to `react-native-web` on web.
 * - Redirect `react-native-web/dist/modules/AssetRegistry/index.js` to `@react-native/assets/registry.js` on web.
 * - Add support for `tsconfig.json`/`jsconfig.json` aliases via `compilerOptions.paths`.
 * - Alias react-native renderer code to a vendored React canary build on native.
 */
export function withExtendedResolver(
  config: ConfigT,
  {
    tsconfig,
    isTsconfigPathsEnabled,
    isFastResolverEnabled,
    isExporting,
    isReactCanaryEnabled,
    isReactServerComponentsEnabled,
    getMetroBundler,
  }: {
    tsconfig: TsConfigPaths | null;
    isTsconfigPathsEnabled?: boolean;
    isFastResolverEnabled?: boolean;
    isExporting?: boolean;
    isReactCanaryEnabled?: boolean;
    isReactServerComponentsEnabled?: boolean;
    getMetroBundler: () => Bundler;
  }
) {
  if (isReactServerComponentsEnabled) {
    Log.warn(
      `Experimental React Server Components is enabled. Production exports are not supported yet.`
    );
  }
  if (isFastResolverEnabled) {
    Log.warn(`Experimental module resolution is enabled.`);
  }

  if (isReactCanaryEnabled) {
    Log.warn(`Experimental React Canary version is enabled.`);
  }

  const defaultResolver = metroResolver.resolve;
  const resolver = isFastResolverEnabled
    ? createFastResolver({
        preserveSymlinks: true,
        blockList: !config.resolver?.blockList
          ? []
          : Array.isArray(config.resolver?.blockList)
            ? config.resolver?.blockList
            : [config.resolver?.blockList],
      })
    : defaultResolver;

  const aliases: { [key: string]: Record<string, string> } = {
    web: {
      'react-native': 'react-native-web',
      'react-native/index': 'react-native-web',
      'react-native/Libraries/Image/resolveAssetSource': 'expo-asset/build/resolveAssetSource',
    },
  };

  let _universalAliases: [RegExp, string][] | null;

  function getUniversalAliases() {
    if (_universalAliases) {
      return _universalAliases;
    }

    _universalAliases = [];

    // This package is currently always installed as it is included in the `expo` package.
    if (resolveFrom.silent(config.projectRoot, '@expo/vector-icons')) {
      debug('Enabling alias: react-native-vector-icons -> @expo/vector-icons');
      _universalAliases.push([/^react-native-vector-icons(\/.*)?/, '@expo/vector-icons$1']);
    }
    if (isReactServerComponentsEnabled) {
      if (resolveFrom.silent(config.projectRoot, 'expo-router/rsc')) {
        debug('Enabling bridge alias: expo-router -> expo-router/rsc');
        _universalAliases.push([/^expo-router$/, 'expo-router/rsc']);
        // Bridge the internal entry point which is a standalone import to ensure package.json resolution works as expected.
        _universalAliases.push([/^expo-router\/entry-classic$/, 'expo-router/rsc/entry']);
      }
    }
    return _universalAliases;
  }

  const preferredMainFields: { [key: string]: string[] } = {
    // Defaults from Expo Webpack. Most packages using `react-native` don't support web
    // in the `react-native` field, so we should prefer the `browser` field.
    // https://github.com/expo/router/issues/37
    web: ['browser', 'module', 'main'],
  };

  let tsConfigResolve =
    isTsconfigPathsEnabled && (tsconfig?.paths || tsconfig?.baseUrl != null)
      ? resolveWithTsConfigPaths.bind(resolveWithTsConfigPaths, {
          paths: tsconfig.paths ?? {},
          baseUrl: tsconfig.baseUrl ?? config.projectRoot,
          hasBaseUrl: !!tsconfig.baseUrl,
        })
      : null;

  // TODO: Move this to be a transform key for invalidation.
  if (!isExporting && isInteractive()) {
    if (isTsconfigPathsEnabled) {
      // TODO: We should track all the files that used imports and invalidate them
      // currently the user will need to save all the files that use imports to
      // use the new aliases.
      const configWatcher = new FileNotifier(config.projectRoot, [
        './tsconfig.json',
        './jsconfig.json',
      ]);
      configWatcher.startObserving(() => {
        debug('Reloading tsconfig.json');
        loadTsConfigPathsAsync(config.projectRoot).then((tsConfigPaths) => {
          if (tsConfigPaths?.paths && !!Object.keys(tsConfigPaths.paths).length) {
            debug('Enabling tsconfig.json paths support');
            tsConfigResolve = resolveWithTsConfigPaths.bind(resolveWithTsConfigPaths, {
              paths: tsConfigPaths.paths ?? {},
              baseUrl: tsConfigPaths.baseUrl ?? config.projectRoot,
              hasBaseUrl: !!tsConfigPaths.baseUrl,
            });
          } else {
            debug('Disabling tsconfig.json paths support');
            tsConfigResolve = null;
          }
        });
      });

      // TODO: This probably prevents the process from exiting.
      installExitHooks(() => {
        configWatcher.stopObserving();
      });
    } else {
      debug('Skipping tsconfig.json paths support');
    }
  }

  let nodejsSourceExtensions: string[] | null = null;

  function getStrictResolver(
    { resolveRequest, ...context }: ResolutionContext,
    platform: string | null
  ) {
    return function doResolve(moduleName: string): Resolution {
      return resolver(context, moduleName, platform);
    };
  }

  function getOptionalResolver(context: ResolutionContext, platform: string | null) {
    const doResolve = getStrictResolver(context, platform);
    return function optionalResolve(moduleName: string): Resolution | null {
      try {
        return doResolve(moduleName);
      } catch (error) {
        // If the error is directly related to a resolver not being able to resolve a module, then
        // we can ignore the error and try the next resolver. Otherwise, we should throw the error.
        const isResolutionError =
          isFailedToResolveNameError(error) || isFailedToResolvePathError(error);
        if (!isResolutionError) {
          throw error;
        }
      }
      return null;
    };
  }

  // TODO: This is a hack to get resolveWeak working.
  const idFactory =
    config.serializer?.createModuleIdFactory?.() ?? ((id: number | string): number | string => id);

  const getAssetRegistryModule = () => {
    const virtualModuleId = `\0polyfill:assets-registry`;
    getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
      virtualModuleId,
      ASSET_REGISTRY_SRC
    );
    return {
      type: 'sourceFile',
      filePath: virtualModuleId,
    } as const;
  };

  // If Node.js pass-through, then remap to a module like `module.exports = $$require_external(<module>)`.
  // If module should be shimmed, remap to an empty module.
  const externals: {
    match: (context: ResolutionContext, moduleName: string, platform: string | null) => boolean;
    replace: 'empty' | 'node' | 'weak';
  }[] = [
    {
      match: (context: ResolutionContext, moduleName: string) => {
        if (
          // Disable internal externals when exporting for production.
          context.customResolverOptions.exporting ||
          // These externals are only for Node.js environments.
          !isServerEnvironment(context.customResolverOptions?.environment)
        ) {
          return false;
        }

        if (context.customResolverOptions?.environment === 'react-server') {
          // Ensure these non-react-server modules are excluded when bundling for React Server Components in development.
          return /^(source-map-support(\/.*)?|@babel\/runtime\/.+|debug|metro-runtime\/src\/modules\/HMRClient|metro|acorn-loose|acorn|chalk|ws|ansi-styles|supports-color|color-convert|has-flag|utf-8-validate|color-name|react-refresh\/runtime|@remix-run\/node\/.+)$/.test(
            moduleName
          );
        }

        // Extern these modules in standard Node.js environments in development to prevent API routes side-effects
        // from leaking into the dev server process.
        return /^(source-map-support(\/.*)?|react|react-native-helmet-async|@radix-ui\/.+|@babel\/runtime\/.+|react-dom(\/.+)?|debug|acorn-loose|acorn|css-in-js-utils\/lib\/.+|hyphenate-style-name|color|color-string|color-convert|color-name|fontfaceobserver|fast-deep-equal|query-string|escape-string-regexp|invariant|postcss-value-parser|memoize-one|nullthrows|strict-uri-encode|decode-uri-component|split-on-first|filter-obj|warn-once|simple-swizzle|is-arrayish|inline-style-prefixer\/.+)$/.test(
          moduleName
        );
      },
      replace: 'node',
    },
    // Externals to speed up async split chunks by extern-ing common packages that appear in the root client chunk.
    {
      match: (context: ResolutionContext, moduleName: string, platform: string | null) => {
        if (
          // Disable internal externals when exporting for production.
          context.customResolverOptions.exporting ||
          // These externals are only for client environments.
          isServerEnvironment(context.customResolverOptions?.environment) ||
          // Only enable for client boundaries
          !context.customResolverOptions.clientboundary
        ) {
          return false;
        }

        // We don't support this in the resolver at the moment.
        if (moduleName.endsWith('/package.json')) {
          return false;
        }

        const isExternal = // Extern these modules in standard Node.js environments.
          /^(styleq(\/.+)?|deprecated-react-native-prop-types|react-native-safe-area-context|invariant|nullthrows|memoize-one|react|react\/jsx-dev-runtime|scheduler|expo-modules-core|react-native|react-dom(\/.+)?|metro-runtime(\/.+)?)$/.test(
            moduleName
          ) ||
          /^react-native-web\/dist\/exports\/(Platform|NativeEventEmitter|StyleSheet|NativeModules|DeviceEventEmitter|Text|View)$/.test(
            moduleName
          ) ||
          // TODO: Add more
          /^@babel\/runtime\/helpers\/(wrapNativeSuper)$/.test(moduleName);

        return isExternal;
      },
      replace: 'weak',
    },
  ];

  const metroConfigWithCustomResolver = withMetroResolvers(config, [
    // Mock out production react imports in development.
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      // This resolution is dev-only to prevent bundling the production React packages in development.
      if (!context.dev) return null;

      if (
        // Match react-native renderers.
        (platform !== 'web' &&
          context.originModulePath.match(/[\\/]node_modules[\\/]react-native[\\/]/) &&
          moduleName.match(/([\\/]ReactFabric|ReactNativeRenderer)-prod/)) ||
        // Match react production imports.
        (moduleName.match(/\.production(\.min)?\.js$/) &&
          // Match if the import originated from a react package.
          context.originModulePath.match(/[\\/]node_modules[\\/](react[-\\/]|scheduler[\\/])/))
      ) {
        debug(`Skipping production module: ${moduleName}`);
        // /Users/path/to/expo/node_modules/react/index.js ./cjs/react.production.min.js
        // /Users/path/to/expo/node_modules/react/jsx-dev-runtime.js ./cjs/react-jsx-dev-runtime.production.min.js
        // /Users/path/to/expo/node_modules/react-is/index.js ./cjs/react-is.production.min.js
        // /Users/path/to/expo/node_modules/react-refresh/runtime.js ./cjs/react-refresh-runtime.production.min.js
        // /Users/path/to/expo/node_modules/react-native/node_modules/scheduler/index.native.js ./cjs/scheduler.native.production.min.js
        // /Users/path/to/expo/node_modules/react-native/node_modules/react-is/index.js ./cjs/react-is.production.min.js
        return {
          type: 'empty',
        };
      }
      return null;
    },
    // tsconfig paths
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      return (
        tsConfigResolve?.(
          {
            originModulePath: context.originModulePath,
            moduleName,
          },
          getOptionalResolver(context, platform)
        ) ?? null
      );
    },

    // Node.js externals support
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      const isServer =
        context.customResolverOptions?.environment === 'node' ||
        context.customResolverOptions?.environment === 'react-server';

      const moduleId = isNodeExternal(moduleName);
      if (!moduleId) {
        return null;
      }

      if (
        // In browser runtimes, we want to either resolve a local node module by the same name, or shim the module to
        // prevent crashing when Node.js built-ins are imported.
        !isServer
      ) {
        // Perform optional resolve first. If the module doesn't exist (no module in the node_modules)
        // then we can mock the file to use an empty module.
        const result = getOptionalResolver(context, platform)(moduleName);

        if (!result && platform !== 'web') {
          // Preserve previous behavior where native throws an error on node.js internals.
          return null;
        }

        return (
          result ?? {
            // In this case, mock the file to use an empty module.
            type: 'empty',
          }
        );
      }
      const contents = `module.exports=$$require_external('node:${moduleId}');`;
      debug(`Virtualizing Node.js "${moduleId}"`);
      const virtualModuleId = `\0node:${moduleId}`;
      getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
        virtualModuleId,
        contents
      );
      return {
        type: 'sourceFile',
        filePath: virtualModuleId,
      };
    },

    // Custom externals support
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      // We don't support this in the resolver at the moment.
      if (moduleName.endsWith('/package.json')) {
        return null;
      }

      const strictResolve = getStrictResolver(context, platform);

      for (const external of externals) {
        if (external.match(context, moduleName, platform)) {
          if (external.replace === 'empty') {
            debug(`Redirecting external "${moduleName}" to "${external.replace}"`);
            return {
              type: external.replace,
            };
          } else if (external.replace === 'weak') {
            // TODO: Make this use require.resolveWeak again. Previously this was just resolving to the same path.
            const realModule = strictResolve(moduleName);
            const realPath = realModule.type === 'sourceFile' ? realModule.filePath : moduleName;
            const opaqueId = idFactory(realPath);

            const contents =
              typeof opaqueId === 'number'
                ? `module.exports=/*${moduleName}*/__r(${opaqueId})`
                : `module.exports=/*${moduleName}*/__r(${JSON.stringify(opaqueId)})`;
            // const contents = `module.exports=/*${moduleName}*/__r(require.resolveWeak('${moduleName}'))`;
            // const generatedModuleId = fastHashMemoized(contents);
            const virtualModuleId = `\0weak:${opaqueId}`;
            debug('Virtualizing module:', moduleName, '->', virtualModuleId);
            getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
              virtualModuleId,
              contents
            );
            return {
              type: 'sourceFile',
              filePath: virtualModuleId,
            };
          } else if (external.replace === 'node') {
            const contents = `module.exports=$$require_external('${moduleName}')`;
            const virtualModuleId = `\0node:${moduleName}`;
            debug('Virtualizing Node.js (custom):', moduleName, '->', virtualModuleId);
            getMetroBundlerWithVirtualModules(getMetroBundler()).setVirtualModule(
              virtualModuleId,
              contents
            );
            return {
              type: 'sourceFile',
              filePath: virtualModuleId,
            };
          } else {
            throw new CommandError(
              `Invalid external alias type: "${external.replace}" for module "${moduleName}" (platform: ${platform}, originModulePath: ${context.originModulePath})`
            );
          }
        }
      }
      return null;
    },

    // Basic moduleId aliases
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      // Conditionally remap `react-native` to `react-native-web` on web in
      // a way that doesn't require Babel to resolve the alias.
      if (platform && platform in aliases && aliases[platform][moduleName]) {
        const redirectedModuleName = aliases[platform][moduleName];
        return getStrictResolver(context, platform)(redirectedModuleName);
      }

      for (const [matcher, alias] of getUniversalAliases()) {
        const match = moduleName.match(matcher);
        if (match) {
          const aliasedModule = alias.replace(
            /\$(\d+)/g,
            (_, index) => match[parseInt(index, 10)] ?? ''
          );
          const doResolve = getStrictResolver(context, platform);
          debug(`Alias "${moduleName}" to "${aliasedModule}"`);
          return doResolve(aliasedModule);
        }
      }

      return null;
    },

    // Polyfill for asset registry
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      if (/^@react-native\/assets-registry\/registry(\.js)?$/.test(moduleName)) {
        return getAssetRegistryModule();
      }

      if (
        platform === 'web' &&
        context.originModulePath.match(/node_modules[\\/]react-native-web[\\/]/) &&
        moduleName.includes('/modules/AssetRegistry')
      ) {
        return getAssetRegistryModule();
      }

      return null;
    },

    // TODO: Reduce these as much as possible in the future.
    // Complex post-resolution rewrites.
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      const doResolve = getStrictResolver(context, platform);

      const result = doResolve(moduleName);

      if (result.type !== 'sourceFile') {
        return result;
      }

      if (platform === 'web') {
        if (result.filePath.includes('node_modules')) {
          // // Disallow importing confusing native modules on web
          if (moduleName.includes('react-native/Libraries/Utilities/codegenNativeCommands')) {
            throw new FailedToResolvePathError(
              `Importing native-only module "${moduleName}" on web from: ${context.originModulePath}`
            );
          }

          // Replace with static shims

          const normalName = normalizeSlashes(result.filePath)
            // Drop everything up until the `node_modules` folder.
            .replace(/.*node_modules\//, '');

          const shimFile = shouldCreateVirtualShim(normalName);
          if (shimFile) {
            const virtualId = `\0shim:${normalName}`;
            const bundler = getMetroBundlerWithVirtualModules(getMetroBundler());
            if (!bundler.hasVirtualModule(virtualId)) {
              bundler.setVirtualModule(virtualId, fs.readFileSync(shimFile, 'utf8'));
            }
            debug(`Redirecting module "${result.filePath}" to shim`);

            return {
              ...result,
              filePath: virtualId,
            };
          }
        }
      } else {
        const isServer =
          context.customResolverOptions?.environment === 'node' ||
          context.customResolverOptions?.environment === 'react-server';

        // react-native/Libraries/Core/InitializeCore
        const normal = normalizeSlashes(result.filePath);

        // Shim out React Native native runtime globals in server mode for native.
        if (isServer) {
          if (normal.endsWith('react-native/Libraries/Core/InitializeCore.js')) {
            console.log('Shimming out InitializeCore for React Native in native SSR bundle');
            return {
              type: 'empty',
            };
          }
        }

        // When server components are enabled, redirect React Native's renderer to the canary build
        // this will enable the use hook and other requisite features from React 19.
        if (isReactCanaryEnabled && result.filePath.includes('node_modules')) {
          const normalName = normalizeSlashes(result.filePath)
            // Drop everything up until the `node_modules` folder.
            .replace(/.*node_modules\//, '');

          const canaryFile = shouldCreateVirtualCanary(normalName);
          if (canaryFile) {
            debug(`Redirecting React Native module "${result.filePath}" to canary build`);
            return {
              ...result,
              filePath: canaryFile,
            };
          }
        }
      }

      return result;
    },
  ]);

  // Ensure we mutate the resolution context to include the custom resolver options for server and web.
  const metroConfigWithCustomContext = withMetroMutatedResolverContext(
    metroConfigWithCustomResolver,
    (
      immutableContext: CustomResolutionContext,
      moduleName: string,
      platform: string | null
    ): CustomResolutionContext => {
      const context: Mutable<CustomResolutionContext> = {
        ...immutableContext,
        preferNativePlatform: platform !== 'web',
      };

      // TODO: Remove this when we have React 19 in the expo/expo monorepo.
      if (
        isReactCanaryEnabled &&
        // Change the node modules path for react and react-dom to use the vendor in Expo CLI.
        /^(react|react\/.*|react-dom|react-dom\/.*)$/.test(moduleName)
      ) {
        context.nodeModulesPaths = [
          path.join(require.resolve('@expo/cli/package.json'), '../static/canary-full'),
        ];
      }

      if (isServerEnvironment(context.customResolverOptions?.environment)) {
        // Adjust nodejs source extensions to sort mjs after js, including platform variants.
        if (nodejsSourceExtensions === null) {
          nodejsSourceExtensions = getNodejsExtensions(context.sourceExts);
        }
        context.sourceExts = nodejsSourceExtensions;

        context.unstable_enablePackageExports = true;
        context.unstable_conditionsByPlatform = {};

        const isReactServerComponents =
          context.customResolverOptions?.environment === 'react-server';

        if (isReactServerComponents) {
          // NOTE: Align the behavior across server and client. This is a breaking change so we'll just roll it out with React Server Components.
          // This ensures that react-server and client code both resolve `module` and `main` in the same order.
          if (platform === 'web') {
            // Node.js runtimes should only be importing main at the moment.
            // This is a temporary fix until we can support the package.json exports.
            context.mainFields = ['module', 'main'];
          } else {
            // In Node.js + native, use the standard main fields.
            context.mainFields = ['react-native', 'module', 'main'];
          }
        } else {
          if (platform === 'web') {
            // Node.js runtimes should only be importing main at the moment.
            // This is a temporary fix until we can support the package.json exports.
            context.mainFields = ['main', 'module'];
          } else {
            // In Node.js + native, use the standard main fields.
            context.mainFields = ['react-native', 'main', 'module'];
          }
        }

        // Enable react-server import conditions.
        if (context.customResolverOptions?.environment === 'react-server') {
          context.unstable_conditionNames = ['node', 'require', 'react-server', 'workerd'];
        } else {
          context.unstable_conditionNames = ['node', 'require'];
        }
      } else {
        // Non-server changes

        if (!env.EXPO_METRO_NO_MAIN_FIELD_OVERRIDE && platform && platform in preferredMainFields) {
          context.mainFields = preferredMainFields[platform];
        }
      }

      return context;
    }
  );

  return withMetroErrorReportingResolver(metroConfigWithCustomContext);
}

/** @returns `true` if the incoming resolution should be swapped. */
export function shouldAliasModule(
  input: {
    platform: string | null;
    result: Resolution;
  },
  alias: { platform: string; output: string }
): boolean {
  return (
    input.platform === alias.platform &&
    input.result?.type === 'sourceFile' &&
    typeof input.result?.filePath === 'string' &&
    normalizeSlashes(input.result.filePath).endsWith(alias.output)
  );
}

/** Add support for `react-native-web` and the Web platform. */
export async function withMetroMultiPlatformAsync(
  projectRoot: string,
  {
    config,
    exp,
    platformBundlers,
    isTsconfigPathsEnabled,
    isFastResolverEnabled,
    isExporting,
    isReactCanaryEnabled,
    isNamedRequiresEnabled,
    isReactServerComponentsEnabled,
    getMetroBundler,
  }: {
    config: ConfigT;
    exp: ExpoConfig;
    isTsconfigPathsEnabled: boolean;
    platformBundlers: PlatformBundlers;
    isFastResolverEnabled?: boolean;
    isExporting?: boolean;
    isReactCanaryEnabled: boolean;
    isReactServerComponentsEnabled: boolean;
    isNamedRequiresEnabled: boolean;
    getMetroBundler: () => Bundler;
  }
) {
  if (isNamedRequiresEnabled) {
    debug('Using Expo metro require runtime.');
    // Change the default metro-runtime to a custom one that supports bundle splitting.
    require('metro-config/src/defaults/defaults').moduleSystem = require.resolve(
      '@expo/cli/build/metro-require/require'
    );
  }

  if (!config.projectRoot) {
    // @ts-expect-error: read-only types
    config.projectRoot = projectRoot;
  }

  // Required for @expo/metro-runtime to format paths in the web LogBox.
  process.env.EXPO_PUBLIC_PROJECT_ROOT = process.env.EXPO_PUBLIC_PROJECT_ROOT ?? projectRoot;

  // This is used for running Expo CLI in development against projects outside the monorepo.
  if (!isDirectoryIn(__dirname, projectRoot)) {
    if (!config.watchFolders) {
      // @ts-expect-error: watchFolders is readonly
      config.watchFolders = [];
    }
    // @ts-expect-error: watchFolders is readonly
    config.watchFolders.push(path.join(require.resolve('metro-runtime/package.json'), '../..'));
    if (isReactCanaryEnabled) {
      // @ts-expect-error: watchFolders is readonly
      config.watchFolders.push(path.join(require.resolve('@expo/cli/package.json'), '..'));
    }
  }

  // TODO: Remove this
  // @ts-expect-error: Invalidate the cache when the location of expo-router changes on-disk.
  config.transformer._expoRouterPath = resolveFrom.silent(projectRoot, 'expo-router');

  let tsconfig: null | TsConfigPaths = null;

  if (isTsconfigPathsEnabled) {
    tsconfig = await loadTsConfigPathsAsync(projectRoot);
  }

  let expoConfigPlatforms = Object.entries(platformBundlers)
    .filter(
      ([platform, bundler]) => bundler === 'metro' && exp.platforms?.includes(platform as Platform)
    )
    .map(([platform]) => platform);

  if (Array.isArray(config.resolver.platforms)) {
    expoConfigPlatforms = [...new Set(expoConfigPlatforms.concat(config.resolver.platforms))];
  }

  // @ts-expect-error: typed as `readonly`.
  config.resolver.platforms = expoConfigPlatforms;

  config = withWebPolyfills(config, { getMetroBundler });

  return withExtendedResolver(config, {
    tsconfig,
    isExporting,
    isTsconfigPathsEnabled,
    isFastResolverEnabled,
    isReactCanaryEnabled,
    isReactServerComponentsEnabled,
    getMetroBundler,
  });
}

function isDirectoryIn(targetPath: string, rootPath: string) {
  return targetPath.startsWith(rootPath) && targetPath.length >= rootPath.length;
}
