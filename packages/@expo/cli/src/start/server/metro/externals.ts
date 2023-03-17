/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import fs from 'fs';
import { ConfigT } from 'metro-config';
import { Resolution, ResolutionContext } from 'metro-resolver';
import path from 'path';
import resolveFrom from 'resolve-from';

import { Log } from '../../../log';
import { FileNotifier } from '../../../utils/FileNotifier';
import { env } from '../../../utils/env';
import { installExitHooks } from '../../../utils/exit';
import { learnMore } from '../../../utils/link';
import { loadTsConfigPathsAsync, TsConfigPaths } from '../../../utils/tsconfig/loadTsConfigPaths';
import { resolveWithTsConfigPaths } from '../../../utils/tsconfig/resolveWithTsConfigPaths';
import { WebSupportProjectPrerequisite } from '../../doctor/web/WebSupportProjectPrerequisite';
import { PlatformBundlers } from '../platformBundlers';
import { isFailedToResolveNameError, isFailedToResolvePathError } from './metroErrors';
import { importMetroResolverFromProject } from './resolveFromProject';
import { getAppRouterRelativeEntryPath } from './router';
import { withMetroResolvers } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:multi-platform') as typeof console.log;

function withWebPolyfills(config: ConfigT, projectRoot: string): ConfigT {
  const originalGetPolyfills = config.serializer.getPolyfills
    ? config.serializer.getPolyfills.bind(config.serializer)
    : () => [];

  const getPolyfills = (ctx: { platform: string | null | undefined }): readonly string[] => {
    if (ctx.platform === 'web') {
      return [
        // NOTE: We might need this for all platforms
        path.join(projectRoot, EXTERNAL_REQUIRE_POLYFILL),
        // TODO: runtime polyfills, i.e. Fast Refresh, error overlay, React Dev Tools...
      ];
    }
    // Generally uses `rn-get-polyfills`
    return originalGetPolyfills(ctx);
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

// A list of the Node.js standard library modules.
const NODE_STDLIB_MODULES = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'fs/promises',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
];

/**
 * Apply custom resolvers to do the following:
 * - Disable `.native.js` extensions on web.
 * - Alias `react-native` to `react-native-web` on web.
 * - Redirect `react-native-web/dist/modules/AssetRegistry/index.js` to `@react-native/assets/registry.js` on web.
 * - Add support for `tsconfig.json`/`jsconfig.json` aliases via `compilerOptions.paths`.
 */
export function withExtendedResolver(
  config: ConfigT,
  projectRoot: string,
  tsconfig: TsConfigPaths | null,
  platforms: string[]
) {
  // Get the `transformer.assetRegistryPath`
  // this needs to be unified since you can't dynamically
  // swap out the transformer based on platform.
  const assetRegistryPath = fs.realpathSync(
    // This is the native asset registry alias for native.
    path.resolve(resolveFrom(projectRoot, 'react-native/Libraries/Image/AssetRegistry'))
    // NOTE(EvanBacon): This is the newer import but it doesn't work in the expo/expo monorepo.
    // path.resolve(resolveFrom(projectRoot, '@react-native/assets/registry.js'))
  );

  const isWebEnabled = platforms.includes('web');

  const { resolve } = importMetroResolverFromProject(projectRoot);

  const extraNodeModules: { [key: string]: Record<string, string> } = {};

  const aliases: { [key: string]: Record<string, string> } = {
    web: {
      'react-native': 'react-native-web',
    },
  };

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

  let tsConfigResolve =
    tsconfig?.paths && env.EXPO_USE_PATH_ALIASES
      ? resolveWithTsConfigPaths.bind(resolveWithTsConfigPaths, {
          paths: tsconfig.paths ?? {},
          baseUrl: tsconfig.baseUrl,
        })
      : null;

  if (env.EXPO_USE_PATH_ALIASES && !env.CI) {
    // TODO: We should track all the files that used imports and invalidate them
    // currently the user will need to save all the files that use imports to
    // use the new aliases.
    const configWatcher = new FileNotifier(projectRoot, ['./tsconfig.json', './jsconfig.json']);
    configWatcher.startObserving(() => {
      debug('Reloading tsconfig.json');
      loadTsConfigPathsAsync(projectRoot).then((tsConfigPaths) => {
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

  return withMetroResolvers(config, projectRoot, [
    // Add a resolver to alias the web asset resolver.
    (immutableContext: ResolutionContext, moduleName: string, platform: string | null) => {
      let context = {
        ...immutableContext,
      } as ResolutionContext & { mainFields: string[] };

      // const preset = context.customResolverOptions?.preset;

      // TODO: We need to prevent the require.context from including API routes as these use externals.
      // Should be fine after async routes lands.
      // if (preset === 'node') {
      const moduleId = moduleName.replace(/^node:/, '');
      if (NODE_STDLIB_MODULES.includes(moduleId)) {
        moduleName = path.relative(
          path.dirname(context.originModulePath),
          path.join(METRO_EXTERNALS_FOLDER, moduleId, 'index.js')
        );
        console.log('node preset:', context.originModulePath, moduleName, moduleId);
      }
      // }

      // Conditionally remap `react-native` to `react-native-web` on web in
      // a way that doesn't require Babel to resolve the alias.
      if (platform && platform in aliases && aliases[platform][moduleName]) {
        moduleName = aliases[platform][moduleName];
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

      if (tsconfig?.baseUrl && env.EXPO_USE_PATH_ALIASES) {
        context = {
          ...context,
          nodeModulesPaths: [
            ...immutableContext.nodeModulesPaths,
            // add last to ensure node modules are resolved first
            tsconfig.baseUrl,
          ],
        };
      }

      const mainFields = env.EXPO_METRO_NO_MAIN_FIELD_OVERRIDE
        ? context.mainFields
        : platform && platform in preferredMainFields
        ? preferredMainFields[platform]
        : context.mainFields;

      function doResolve(moduleName: string): Resolution | null {
        return resolve(
          {
            ...context,
            preferNativePlatform: platform !== 'web',
            resolveRequest: undefined,

            // Passing `mainFields` directly won't be considered
            // we need to extend the `getPackageMainPath` directly to
            // use platform specific `mainFields`.
            getPackageMainPath(packageJsonPath) {
              // @ts-expect-error: mainFields is not on type
              const package_ = context.moduleCache.getPackage(packageJsonPath);
              return package_.getMain(mainFields);
            },
          },
          moduleName,
          platform
        );
      }

      function optionalResolve(moduleName: string): Resolution | null {
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
      }

      let result: Resolution | null = null;

      if (tsConfigResolve) {
        result = tsConfigResolve(
          {
            originModulePath: context.originModulePath,
            moduleName,
          },
          optionalResolve
        );
      }

      result ??= doResolve(moduleName);

      if (result) {
        // Replace the web resolver with the original one.
        // This is basically an alias for web-only.
        if (shouldAliasAssetRegistryForWeb(platform, result)) {
          // @ts-expect-error: `readonly` for some reason.
          result.filePath = assetRegistryPath;
        }
      }
      return result;
    },
  ]);
}

export const EXTERNAL_REQUIRE_POLYFILL = '.expo/metro/polyfill.js';
export const EXTERNAL_REQUIRE_NATIVE_POLYFILL = '.expo/metro/polyfill.native.js';
export const METRO_EXTERNALS_FOLDER = '.expo/metro/externals';

export function getNodeExternalModuleId(fromModule: string, moduleId: string) {
  return path.relative(
    path.dirname(fromModule),
    path.join(METRO_EXTERNALS_FOLDER, moduleId, 'index.js')
  );
}

export async function setupNodeExternals(projectRoot: string) {
  await tapExternalRequirePolyfill(projectRoot);
  await tapNodeShims(projectRoot);
}

export async function tapExternalRequirePolyfill(projectRoot: string) {
  await fs.promises.mkdir(path.join(projectRoot, path.dirname(EXTERNAL_REQUIRE_POLYFILL)), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(projectRoot, EXTERNAL_REQUIRE_POLYFILL),
    'global.require_x = typeof window === "undefined" ? require : () => null;'
  );
  await fs.promises.writeFile(
    path.join(projectRoot, EXTERNAL_REQUIRE_NATIVE_POLYFILL),
    'global.require_x = (moduleId) => {throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);}'
  );
}

export function isNodeExternal(moduleName: string): string | null {
  const moduleId = moduleName.replace(/^node:/, '');
  if (NODE_STDLIB_MODULES.includes(moduleId)) {
    return moduleId;
  }
  return null;
}

function tapNodeShimContents(moduleId) {
  return `module.exports = require_x('node:${moduleId}');`;
}

// Ensure Node.js shims which require using `require_x` are available inside the project.
export async function tapNodeShims(projectRoot: string) {
  const externals = {};
  for (const moduleId of NODE_STDLIB_MODULES) {
    const shimDir = path.join(projectRoot, METRO_EXTERNALS_FOLDER, moduleId);
    const shimPath = path.join(shimDir, 'index.js');
    externals[moduleId] = shimPath;

    if (!fs.existsSync(shimPath)) {
      await fs.promises.mkdir(shimDir, { recursive: true });
      await fs.promises.writeFile(shimPath, tapNodeShimContents(moduleId));
    }
  }
}
