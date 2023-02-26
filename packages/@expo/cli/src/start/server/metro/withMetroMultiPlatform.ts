/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { ConfigT } from 'metro-config';
import { Resolution, ResolutionContext } from 'metro-resolver';
import path from 'path';
import resolveFrom from 'resolve-from';

import { env } from '../../../utils/env';
import { WebSupportProjectPrerequisite } from '../../doctor/web/WebSupportProjectPrerequisite';
import { PlatformBundlers } from '../platformBundlers';
import { importMetroResolverFromProject } from './resolveFromProject';
import { getAppRouterRelativeEntryPath } from './router';
import { withMetroResolvers } from './withMetroResolvers';

function withWebPolyfills(config: ConfigT): ConfigT {
  const originalGetPolyfills = config.serializer.getPolyfills
    ? config.serializer.getPolyfills.bind(config.serializer)
    : () => [];

  const getPolyfills = (ctx: { platform: string | null | undefined }): readonly string[] => {
    if (ctx.platform === 'web') {
      return [
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

/**
 * Apply custom resolvers to do the following:
 * - Disable `.native.js` extensions on web.
 * - Alias `react-native` to `react-native-web` on web.
 * - Redirect `react-native-web/dist/modules/AssetRegistry/index.js` to `@react-native/assets/registry.js` on web.
 */
export function withWebResolvers(config: ConfigT, projectRoot: string) {
  // Get the `transformer.assetRegistryPath`
  // this needs to be unified since you can't dynamically
  // swap out the transformer based on platform.
  const assetRegistryPath = fs.realpathSync(
    // This is the native asset registry alias for native.
    path.resolve(resolveFrom(projectRoot, 'react-native/Libraries/Image/AssetRegistry'))
    // NOTE(EvanBacon): This is the newer import but it doesn't work in the expo/expo monorepo.
    // path.resolve(resolveFrom(projectRoot, '@react-native/assets/registry.js'))
  );

  // Create a resolver which dynamically disables support for
  // `*.native.*` extensions on web.

  const { resolve } = importMetroResolverFromProject(projectRoot);

  const extraNodeModules: { [key: string]: Record<string, string> } = {
    web: {
      'react-native': path.resolve(require.resolve('react-native-web/package.json'), '..'),
    },
  };

  const aliases: { [key: string]: Record<string, string> } = {
    web: {
      'react-native': 'react-native-web',
    },
  };
  const modeAliases: { [key: string]: Record<string, string> } = {
    node: {
      'react-native-web': 'expo-router/src/react-native',
      'react-native': 'expo-router/src/react-native',
      'expo-router': 'expo-router/src/expo-router',
    },
  };

  const preferredMainFields: { [key: string]: string[] } = {
    // Defaults from Expo Webpack. Most packages using `react-native` don't support web
    // in the `react-native` field, so we should prefer the `browser` field.
    // https://github.com/expo/router/issues/37
    web: ['browser', 'module', 'main'],
  };

  return withMetroResolvers(config, projectRoot, [
    // Add a resolver to alias the web asset resolver.
    (immutableContext: ResolutionContext, moduleName: string, platform: string | null) => {
      const context = { ...immutableContext } as ResolutionContext & { mainFields: string[] };
      // @ts-expect-error
      const mode = context.customResolverOptions?.expo_mode;
      // Send the mode to the babel transformer
      const isServerComponent =
        mode === 'node' && immutableContext.originModulePath.match(/\+server\.[tj]sx?$/);
      // console.log('context', context);
      // Conditionally remap `react-native` to `react-native-web` on web in
      // a way that doesn't require Babel to resolve the alias.
      if (isServerComponent) {
        console.log('>>', mode, moduleName);
      } else {
        // console.log('>>', immutableContext.originModulePath);
      }

      if (isServerComponent && mode && mode in modeAliases && modeAliases[mode][moduleName]) {
        console.log('aliasing', moduleName, 'to', modeAliases[mode][moduleName]);
        moduleName = modeAliases[mode][moduleName];
      } else if (!mode && moduleName === 'expo-router/src/react-native') {
        moduleName = 'react-native';
      }
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

      const mainFields = env.EXPO_METRO_NO_MAIN_FIELD_OVERRIDE
        ? context.mainFields
        : platform && platform in preferredMainFields
        ? preferredMainFields[platform]
        : context.mainFields;

      const result = resolve(
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

      // Replace the web resolver with the original one.
      // This is basically an alias for web-only.
      if (shouldAliasAssetRegistryForWeb(platform, result)) {
        // @ts-expect-error: `readonly` for some reason.
        result.filePath = assetRegistryPath;
      }

      return result;
    },
  ]);
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

/** Add support for `react-native-web` and the Web platform. */
export async function withMetroMultiPlatformAsync(
  projectRoot: string,
  config: ConfigT,
  platformBundlers: PlatformBundlers
) {
  // Auto pick App entry: this is injected with Babel.
  process.env.EXPO_ROUTER_APP_ROOT = getAppRouterRelativeEntryPath(projectRoot);
  process.env.EXPO_PROJECT_ROOT = process.env.EXPO_PROJECT_ROOT ?? projectRoot;

  if (env.EXPO_USE_STATIC) {
    // Enable static rendering in runtime space.
    process.env.EXPO_PUBLIC_USE_STATIC = '1';
  }

  if (platformBundlers.web === 'metro') {
    await new WebSupportProjectPrerequisite(projectRoot).assertAsync();
  } else {
    // Bail out early for performance enhancements if web is not enabled.
    return config;
  }

  return withMetroMultiPlatform(projectRoot, config, platformBundlers);
}

function withMetroMultiPlatform(
  projectRoot: string,
  config: ConfigT,
  platformBundlers: PlatformBundlers
) {
  let expoConfigPlatforms = Object.entries(platformBundlers)
    .filter(([, bundler]) => bundler === 'metro')
    .map(([platform]) => platform);

  if (Array.isArray(config.resolver.platforms)) {
    expoConfigPlatforms = [...new Set(expoConfigPlatforms.concat(config.resolver.platforms))];
  }

  // @ts-expect-error: typed as `readonly`.
  config.resolver.platforms = expoConfigPlatforms;

  config = withWebPolyfills(config);

  return withWebResolvers(config, projectRoot);
}
