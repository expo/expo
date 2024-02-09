import { ExpoConfig } from '@expo/config';
import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';
import resolveFrom from 'resolve-from';

import { env } from '../../../utils/env';
import { getRouterDirectoryModuleIdWithManifest } from '../metro/router';

const debug = require('debug')('expo:metro:options') as typeof console.log;

export type ExpoMetroOptions = {
  platform: string;
  mainModuleName: string;
  mode: string;
  minify?: boolean;
  environment?: string;
  serializerOutput?: 'static';
  serializerIncludeMaps?: boolean;
  serializerIncludeBytecode?: boolean;
  lazy?: boolean;
  engine?: 'hermes';
  preserveEnvVars?: boolean;
  /** Enable async routes (route-based bundle splitting) in Expo Router. */
  asyncRoutes?: boolean;
  /** Module ID relative to the projectRoot for the Expo Router app directory. */
  routerRoot: string;
  baseUrl?: string;
  isExporting: boolean;
  inlineSourceMap?: boolean;
};

export type SerializerOptions = {
  includeSourceMaps?: boolean;
  includeBytecode?: boolean;
  output?: 'static';
};

export type ExpoMetroBundleOptions = MetroBundleOptions & {
  serializerOptions?: SerializerOptions;
};

export function shouldEnableAsyncImports(projectRoot: string): boolean {
  if (env.EXPO_NO_METRO_LAZY) {
    return false;
  }

  // `@expo/metro-runtime` includes support for the fetch + eval runtime code required
  // to support async imports. If it's not installed, we can't support async imports.
  // If it is installed, the user MUST import it somewhere in their project.
  // Expo Router automatically pulls this in, so we can check for it.
  return resolveFrom.silent(projectRoot, '@expo/metro-runtime') != null;
}

function withDefaults({
  mode = 'development',
  minify = mode === 'production',
  preserveEnvVars = env.EXPO_NO_CLIENT_ENV_VARS,
  lazy,
  ...props
}: ExpoMetroOptions): ExpoMetroOptions {
  return {
    mode,
    minify,
    preserveEnvVars,
    lazy: !props.isExporting && lazy,
    ...props,
  };
}

export function getBaseUrlFromExpoConfig(exp: ExpoConfig) {
  return exp.experiments?.baseUrl?.trim().replace(/\/+$/, '') ?? '';
}
export function getAsyncRoutesFromExpoConfig(exp: ExpoConfig, mode: string, platform: string) {
  let asyncRoutesSetting;

  if (exp.extra?.router?.asyncRoutes) {
    const asyncRoutes = exp.extra?.router?.asyncRoutes;
    if (['boolean', 'string'].includes(typeof asyncRoutes)) {
      asyncRoutesSetting = asyncRoutes;
    } else if (typeof asyncRoutes === 'object') {
      asyncRoutesSetting = asyncRoutes[platform] ?? asyncRoutes.default;
    }
  }

  return [mode, true].includes(asyncRoutesSetting);
}

export function getMetroDirectBundleOptionsForExpoConfig(
  projectRoot: string,
  exp: ExpoConfig,
  options: Omit<ExpoMetroOptions, 'baseUrl' | 'routerRoot' | 'asyncRoutes'>
): Partial<ExpoMetroBundleOptions> {
  return getMetroDirectBundleOptions({
    ...options,
    baseUrl: getBaseUrlFromExpoConfig(exp),
    routerRoot: getRouterDirectoryModuleIdWithManifest(projectRoot, exp),
    asyncRoutes: getAsyncRoutesFromExpoConfig(exp, options.mode, options.platform),
  });
}

export function getMetroDirectBundleOptions(
  options: ExpoMetroOptions
): Partial<ExpoMetroBundleOptions> {
  const {
    mainModuleName,
    platform,
    mode,
    minify,
    environment,
    serializerOutput,
    serializerIncludeMaps,
    serializerIncludeBytecode,
    lazy,
    engine,
    preserveEnvVars,
    asyncRoutes,
    baseUrl,
    routerRoot,
    isExporting,
    inlineSourceMap,
  } = withDefaults(options);

  const dev = mode !== 'production';
  const isHermes = engine === 'hermes';

  if (isExporting) {
    debug('Disabling lazy bundling for export build');
    options.lazy = false;
  }

  let fakeSourceUrl: string | undefined;
  let fakeSourceMapUrl: string | undefined;

  // TODO: Upstream support to Metro for passing custom serializer options.
  if (
    serializerIncludeMaps != null ||
    serializerOutput != null ||
    serializerIncludeBytecode != null
  ) {
    fakeSourceUrl = new URL(
      createBundleUrlPath(options).replace(/^\//, ''),
      'http://localhost:8081'
    ).toString();
    if (serializerIncludeMaps) {
      fakeSourceMapUrl = fakeSourceUrl.replace('.bundle?', '.map?');
    }
  }

  const bundleOptions: Partial<ExpoMetroBundleOptions> = {
    platform,
    entryFile: mainModuleName,
    dev,
    minify: !isHermes && (minify ?? !dev),
    inlineSourceMap: inlineSourceMap ?? false,
    lazy,
    unstable_transformProfile: isHermes ? 'hermes-stable' : 'default',
    customTransformOptions: {
      __proto__: null,
      engine,
      preserveEnvVars,
      asyncRoutes,
      environment,
      baseUrl,
      routerRoot,
    },
    customResolverOptions: {
      __proto__: null,
      environment,
    },
    sourceMapUrl: fakeSourceMapUrl,
    sourceUrl: fakeSourceUrl,
    serializerOptions: {
      output: serializerOutput,
      includeSourceMaps: serializerIncludeMaps,
      includeBytecode: serializerIncludeBytecode,
    },
  };

  return bundleOptions;
}

export function createBundleUrlPathFromExpoConfig(
  projectRoot: string,
  exp: ExpoConfig,
  options: Omit<ExpoMetroOptions, 'baseUrl' | 'routerRoot'>
): string {
  return createBundleUrlPath({
    ...options,
    baseUrl: getBaseUrlFromExpoConfig(exp),
    routerRoot: getRouterDirectoryModuleIdWithManifest(projectRoot, exp),
  });
}

export function createBundleUrlPath(options: ExpoMetroOptions): string {
  const {
    platform,
    mainModuleName,
    mode,
    minify,
    environment,
    serializerOutput,
    serializerIncludeMaps,
    serializerIncludeBytecode,
    lazy,
    engine,
    preserveEnvVars,
    asyncRoutes,
    baseUrl,
    routerRoot,
    inlineSourceMap,
    isExporting,
  } = withDefaults(options);

  const dev = String(mode !== 'production');
  const queryParams = new URLSearchParams({
    platform: encodeURIComponent(platform),
    dev,
    // TODO: Is this still needed?
    hot: String(false),
  });

  // Lazy bundling must be disabled for bundle splitting to work.
  if (!isExporting && lazy) {
    queryParams.append('lazy', String(lazy));
  }

  if (inlineSourceMap) {
    queryParams.append('inlineSourceMap', String(inlineSourceMap));
  }

  if (minify) {
    queryParams.append('minify', String(minify));
  }

  if (engine) {
    queryParams.append('transform.engine', engine);
  }

  if (asyncRoutes) {
    queryParams.append('transform.asyncRoutes', String(asyncRoutes));
  }
  if (preserveEnvVars) {
    queryParams.append('transform.preserveEnvVars', String(preserveEnvVars));
  }
  if (baseUrl) {
    queryParams.append('transform.baseUrl', baseUrl);
  }
  if (routerRoot != null) {
    queryParams.append('transform.routerRoot', routerRoot);
  }

  if (environment) {
    queryParams.append('resolver.environment', environment);
    queryParams.append('transform.environment', environment);
  }

  if (serializerOutput) {
    queryParams.append('serializer.output', serializerOutput);
  }
  if (serializerIncludeMaps) {
    queryParams.append('serializer.map', String(serializerIncludeMaps));
  }
  if (serializerIncludeBytecode) {
    queryParams.append('serializer.bytecode', String(serializerIncludeBytecode));
  }

  return `/${encodeURI(mainModuleName)}.bundle?${queryParams.toString()}`;
}
