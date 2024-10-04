/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { ConfigT } from 'metro-config';
import { Resolution, ResolutionContext, CustomResolutionContext } from 'metro-resolver';
import * as metroResolver from 'metro-resolver';
import path from 'path';
import resolveFrom from 'resolve-from';

import { createFastResolver } from './createExpoMetroResolver';
import {
  EXTERNAL_REQUIRE_NATIVE_POLYFILL,
  EXTERNAL_REQUIRE_POLYFILL,
  METRO_SHIMS_FOLDER,
  getNodeExternalModuleId,
  isNodeExternal,
  setupNodeExternals,
  setupShimFiles,
} from './externals';
import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import { getAppRouterRelativeEntryPath } from './router';
import {
  withMetroErrorReportingResolver,
  withMetroMutatedResolverContext,
  withMetroResolvers,
} from './withMetroResolvers';
import { Log } from '../../../log';
import { FileNotifier } from '../../../utils/FileNotifier';
import { env } from '../../../utils/env';
import { installExitHooks } from '../../../utils/exit';
import { isInteractive } from '../../../utils/interactive';
import { loadTsConfigPathsAsync, TsConfigPaths } from '../../../utils/tsconfig/loadTsConfigPaths';
import { resolveWithTsConfigPaths } from '../../../utils/tsconfig/resolveWithTsConfigPaths';
import { WebSupportProjectPrerequisite } from '../../doctor/web/WebSupportProjectPrerequisite';
import { PlatformBundlers } from '../platformBundlers';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const debug = require('debug')('expo:start:server:metro:multi-platform') as typeof console.log;

function withWebPolyfills(config: ConfigT): ConfigT {
  const originalGetPolyfills = config.serializer.getPolyfills
    ? config.serializer.getPolyfills.bind(config.serializer)
    : () => [];

  const getPolyfills = (ctx: { platform: string | null }): readonly string[] => {
    if (ctx.platform === 'web') {
      return [
        // NOTE: We might need this for all platforms
        path.join(config.projectRoot, EXTERNAL_REQUIRE_POLYFILL),
        // TODO: runtime polyfills, i.e. Fast Refresh, error overlay, React Dev Tools...
      ];
    }
    // Generally uses `rn-get-polyfills`
    const polyfills = originalGetPolyfills(ctx);

    return [...polyfills, path.join(config.projectRoot, EXTERNAL_REQUIRE_NATIVE_POLYFILL)];
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
 */
export function withExtendedResolver(
  config: ConfigT,
  {
    tsconfig,
    platforms,
    isTsconfigPathsEnabled,
    isFastResolverEnabled,
    isExporting,
  }: {
    tsconfig: TsConfigPaths | null;
    platforms: string[];
    isTsconfigPathsEnabled?: boolean;
    isFastResolverEnabled?: boolean;
    isExporting?: boolean;
  }
) {
  if (isFastResolverEnabled) {
    Log.warn(`Experimental bundling features are enabled.`);
  }

  // Get the `transformer.assetRegistryPath`
  // this needs to be unified since you can't dynamically
  // swap out the transformer based on platform.
  const assetRegistryPath = fs.realpathSync(
    path.resolve(resolveFrom(config.projectRoot, '@react-native/assets-registry/registry.js'))
  );

  const defaultResolver = metroResolver.resolve;
  const resolver = isFastResolverEnabled
    ? createFastResolver({
        preserveSymlinks: config.resolver?.unstable_enableSymlinks ?? false,
        blockList: Array.isArray(config.resolver?.blockList)
          ? config.resolver?.blockList
          : [config.resolver?.blockList],
      })
    : defaultResolver;

  const extraNodeModules: { [key: string]: Record<string, string> } = {};

  const aliases: { [key: string]: Record<string, string> } = {
    web: {
      'react-native': 'react-native-web',
      'react-native/index': 'react-native-web',
    },
  };

  // TODO: We can probably drop this resolution hack.
  const isWebEnabled = platforms.includes('web');
  if (isWebEnabled) {
    // Allow `react-native-web` to be optional when web is not enabled but path aliases is.
    extraNodeModules['web'] = {
      'react-native': path.resolve(require.resolve('react-native-web/package.json'), '..'),
    };
  }

  const preferredMainFields: { [key: string]: string[] } = {
    // Defaults from Expo Webpack. Most packages using `react-native` don't support web
    // in the `react-native` field, so we should prefer the `browser` field.
    // https://github.com/expo/router/issues/37
    web: ['browser', 'module', 'main'],
  };

  let tsConfigResolve = tsconfig?.paths
    ? resolveWithTsConfigPaths.bind(resolveWithTsConfigPaths, {
        paths: tsconfig.paths ?? {},
        baseUrl: tsconfig.baseUrl,
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
              baseUrl: tsConfigPaths.baseUrl,
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

  const shimsFolder = path.join(config.projectRoot, METRO_SHIMS_FOLDER);

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

  const metroConfigWithCustomResolver = withMetroResolvers(config, [
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

    // Node.js built-ins get empty externals on web
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      if (
        isFastResolverEnabled ||
        // is web
        platform !== 'web' ||
        // Skip when targeting server runtimes
        context.customResolverOptions?.environment === 'node' ||
        // This transform only applies to Node.js built-ins
        !isNodeExternal(moduleName)
      ) {
        return null;
      }

      // Perform optional resolve first. If the module doesn't exist (no module in the node_modules)
      // then we can mock the file to use an empty module.
      const result = getOptionalResolver(context, platform)(moduleName);
      return (
        result ?? {
          // In this case, mock the file to use an empty module.
          type: 'empty',
        }
      );
    },

    // Node.js externals support
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      if (
        // is web
        platform !== 'web' ||
        // Only apply to server runtimes
        context.customResolverOptions?.environment !== 'node'
      ) {
        return null;
      }

      const moduleId = isNodeExternal(moduleName);
      if (!moduleId) {
        return null;
      }
      const redirectedModuleName = getNodeExternalModuleId(context.originModulePath, moduleId);
      debug(`Redirecting Node.js external "${moduleId}" to "${redirectedModuleName}"`);
      const doResolve = getStrictResolver(context, platform);
      return doResolve(redirectedModuleName);
    },

    // Basic moduleId aliases
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      // Conditionally remap `react-native` to `react-native-web` on web in
      // a way that doesn't require Babel to resolve the alias.
      if (platform && platform in aliases && aliases[platform][moduleName]) {
        const redirectedModuleName = aliases[platform][moduleName];
        const doResolve = getStrictResolver(context, platform);
        return doResolve(redirectedModuleName);
      }

      return null;
    },

    // HACK(EvanBacon):
    // React Native uses `event-target-shim` incorrectly and this causes the native runtime
    // to fail to load. This is a temporary workaround until we can fix this upstream.
    // https://github.com/facebook/react-native/pull/38628
    (context: ResolutionContext, moduleName: string, platform: string | null) => {
      if (platform !== 'web' && moduleName === 'event-target-shim') {
        debug('For event-target-shim to use js:', context.originModulePath);
        const doResolve = getStrictResolver(context, platform);
        return doResolve('event-target-shim/dist/event-target-shim.js');
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

      // Replace the web resolver with the original one.
      // This is basically an alias for web-only.
      // TODO: Drop this in favor of the standalone asset registry module.
      if (shouldAliasAssetRegistryForWeb(platform, result)) {
        // @ts-expect-error: `readonly` for some reason.
        result.filePath = assetRegistryPath;
      }

      if (platform === 'web' && result.filePath.includes('node_modules')) {
        // Replace with static shims

        const normalName = normalizeSlashes(result.filePath)
          // Drop everything up until the `node_modules` folder.
          .replace(/.*node_modules\//, '');

        const shimPath = path.join(shimsFolder, normalName);
        if (fs.existsSync(shimPath)) {
          // @ts-expect-error: `readonly` for some reason.
          result.filePath = shimPath;
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
      const context = {
        ...immutableContext,
      } as Mutable<ResolutionContext> & {
        mainFields: string[];
        customResolverOptions?: Record<string, string>;
      };

      if (context.customResolverOptions?.environment === 'node') {
        // Adjust nodejs source extensions to sort mjs after js, including platform variants.
        if (nodejsSourceExtensions === null) {
          nodejsSourceExtensions = getNodejsExtensions(context.sourceExts);
        }
        context.sourceExts = nodejsSourceExtensions;

        context.unstable_enablePackageExports = true;
        context.unstable_conditionNames = ['node', 'require'];
        context.unstable_conditionsByPlatform = {};
        // Node.js runtimes should only be importing main at the moment.
        // This is a temporary fix until we can support the package.json exports.
        context.mainFields = ['main', 'module'];
      } else {
        // Non-server changes

        if (!env.EXPO_METRO_NO_MAIN_FIELD_OVERRIDE && platform && platform in preferredMainFields) {
          context.mainFields = preferredMainFields[platform];
        }
      }

      // TODO: We may be able to remove this in the future, it's doing no harm
      // by staying here.
      // Conditionally remap `react-native` to `react-native-web`
      if (platform && platform in extraNodeModules) {
        context.extraNodeModules = {
          ...extraNodeModules[platform],
          ...context.extraNodeModules,
        };
      }

      if (tsconfig?.baseUrl && isTsconfigPathsEnabled) {
        const nodeModulesPaths: string[] = [...immutableContext.nodeModulesPaths];

        if (isFastResolverEnabled) {
          // add last to ensure node modules are resolved first
          nodeModulesPaths.push(
            path.isAbsolute(tsconfig.baseUrl)
              ? tsconfig.baseUrl
              : path.join(config.projectRoot, tsconfig.baseUrl)
          );
        } else {
          // add last to ensure node modules are resolved first
          nodeModulesPaths.push(tsconfig.baseUrl);
        }

        context.nodeModulesPaths = nodeModulesPaths;
      }

      // TODO: We can drop this in the next version upgrade (SDK 50).
      const mainFields: string[] = context.mainFields;

      return {
        ...context,
        preferNativePlatform: platform !== 'web',
        // Passing `mainFields` directly won't be considered (in certain version of Metro)
        // we need to extend the `getPackageMainPath` directly to
        // use platform specific `mainFields`.
        // @ts-ignore
        getPackageMainPath(packageJsonPath) {
          // @ts-expect-error: mainFields is not on type
          const package_ = context.moduleCache.getPackage(packageJsonPath);
          return package_.getMain(mainFields);
        },
      };
    }
  );

  return withMetroErrorReportingResolver(metroConfigWithCustomContext);
}

/** @returns `true` if the incoming resolution should be swapped on web. */
export function shouldAliasAssetRegistryForWeb(
  platform: string | null,
  result: Resolution
): boolean {
  return (
    platform === 'web' &&
    result?.type === 'sourceFile' &&
    typeof result?.filePath === 'string' &&
    normalizeSlashes(result.filePath).endsWith(
      'react-native-web/dist/modules/AssetRegistry/index.js'
    )
  );
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
    platformBundlers,
    isTsconfigPathsEnabled,
    webOutput,
    routerDirectory,
    isFastResolverEnabled,
    isExporting,
  }: {
    config: ConfigT;
    isTsconfigPathsEnabled: boolean;
    platformBundlers: PlatformBundlers;
    webOutput?: 'single' | 'static' | 'server';
    routerDirectory: string;
    isFastResolverEnabled?: boolean;
    isExporting?: boolean;
  }
) {
  if (!config.projectRoot) {
    // @ts-expect-error: read-only types
    config.projectRoot = projectRoot;
  }
  // Auto pick app entry for router.
  process.env.EXPO_ROUTER_APP_ROOT = getAppRouterRelativeEntryPath(projectRoot, routerDirectory);

  // Required for @expo/metro-runtime to format paths in the web LogBox.
  process.env.EXPO_PUBLIC_PROJECT_ROOT = process.env.EXPO_PUBLIC_PROJECT_ROOT ?? projectRoot;

  if (['static', 'server'].includes(webOutput ?? '')) {
    // Enable static rendering in runtime space.
    process.env.EXPO_PUBLIC_USE_STATIC = '1';
  }

  // This is used for running Expo CLI in development against projects outside the monorepo.
  if (!isDirectoryIn(__dirname, projectRoot)) {
    if (!config.watchFolders) {
      // @ts-expect-error: watchFolders is readonly
      config.watchFolders = [];
    }
    // @ts-expect-error: watchFolders is readonly
    config.watchFolders.push(path.join(require.resolve('metro-runtime/package.json'), '../..'));
  }

  // Ensure the cache is invalidated if these values change.
  // @ts-expect-error
  config.transformer._expoRouterRootDirectory = process.env.EXPO_ROUTER_APP_ROOT;
  // @ts-expect-error
  config.transformer._expoRouterWebRendering = webOutput;
  // TODO: import mode

  if (platformBundlers.web === 'metro') {
    await new WebSupportProjectPrerequisite(projectRoot).assertAsync();
  }

  let tsconfig: null | TsConfigPaths = null;

  if (isTsconfigPathsEnabled) {
    tsconfig = await loadTsConfigPathsAsync(projectRoot);
  }

  await setupShimFiles(projectRoot);
  await setupNodeExternals(projectRoot);

  let expoConfigPlatforms = Object.entries(platformBundlers)
    .filter(([, bundler]) => bundler === 'metro')
    .map(([platform]) => platform);

  if (Array.isArray(config.resolver.platforms)) {
    expoConfigPlatforms = [...new Set(expoConfigPlatforms.concat(config.resolver.platforms))];
  }

  // @ts-expect-error: typed as `readonly`.
  config.resolver.platforms = expoConfigPlatforms;

  config = withWebPolyfills(config);

  return withExtendedResolver(config, {
    tsconfig,
    isExporting,
    isTsconfigPathsEnabled,
    platforms: expoConfigPlatforms,
    isFastResolverEnabled,
  });
}

function isDirectoryIn(a: string, b: string) {
  return b.startsWith(a) && b.length > a.length;
}
