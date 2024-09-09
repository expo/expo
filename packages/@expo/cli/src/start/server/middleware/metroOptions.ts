import { ExpoConfig } from '@expo/config';
import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';
import resolveFrom from 'resolve-from';

import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { getRouterDirectoryModuleIdWithManifest } from '../metro/router';

const debug = require('debug')('expo:metro:options') as typeof console.log;

export type MetroEnvironment = 'node' | 'react-server' | 'client';

export type ExpoMetroOptions = {
  platform: string;
  mainModuleName: string;
  mode: string;
  minify?: boolean;
  environment?: MetroEnvironment;
  serializerOutput?: 'static';
  serializerIncludeMaps?: boolean;
  lazy?: boolean;
  engine?: 'hermes';
  preserveEnvVars?: boolean;
  bytecode: boolean;
  /** Enable async routes (route-based bundle splitting) in Expo Router. */
  asyncRoutes?: boolean;
  /** Module ID relative to the projectRoot for the Expo Router app directory. */
  routerRoot: string;
  /** Enable React compiler support in Babel. */
  reactCompiler: boolean;
  baseUrl?: string;
  isExporting: boolean;
  /** Is bundling a DOM Component ("use dom"). Requires the entry dom component file path. */
  domRoot?: string;
  inlineSourceMap?: boolean;
  clientBoundaries?: string[];
  splitChunks?: boolean;
  usedExports?: boolean;
  /** Enable optimized bundling (required for tree shaking). */
  optimize?: boolean;
};

export type SerializerOptions = {
  includeSourceMaps?: boolean;
  output?: 'static';
  splitChunks?: boolean;
  usedExports?: boolean;
};

export type ExpoMetroBundleOptions = MetroBundleOptions & {
  serializerOptions?: SerializerOptions;
};

export function isServerEnvironment(environment?: any): boolean {
  return environment === 'node' || environment === 'react-server';
}

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
  preserveEnvVars = mode !== 'development' && env.EXPO_NO_CLIENT_ENV_VARS,
  lazy,
  ...props
}: ExpoMetroOptions): ExpoMetroOptions {
  if (props.bytecode) {
    if (props.platform === 'web') {
      throw new CommandError('Cannot use bytecode with the web platform');
    }
    if (props.engine !== 'hermes') {
      throw new CommandError('Bytecode is only supported with the Hermes engine');
    }
  }

  const optimize =
    props.optimize ??
    (props.environment !== 'node' &&
      mode === 'production' &&
      env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH);

  return {
    mode,
    minify,
    preserveEnvVars,
    optimize,
    usedExports: optimize && env.EXPO_UNSTABLE_TREE_SHAKING,
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
  options: Omit<ExpoMetroOptions, 'baseUrl' | 'reactCompiler' | 'routerRoot' | 'asyncRoutes'>
): Partial<ExpoMetroBundleOptions> {
  return getMetroDirectBundleOptions({
    ...options,
    reactCompiler: !!exp.experiments?.reactCompiler,
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
    bytecode,
    lazy,
    engine,
    preserveEnvVars,
    asyncRoutes,
    baseUrl,
    routerRoot,
    isExporting,
    inlineSourceMap,
    splitChunks,
    usedExports,
    reactCompiler,
    optimize,
    domRoot,
    clientBoundaries,
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
  if (serializerIncludeMaps != null || serializerOutput != null) {
    fakeSourceUrl = new URL(
      createBundleUrlPath(options).replace(/^\//, ''),
      'http://localhost:8081'
    ).toString();
    if (serializerIncludeMaps) {
      fakeSourceMapUrl = fakeSourceUrl.replace('.bundle?', '.map?');
    }
  }

  const customTransformOptions: ExpoMetroBundleOptions['customTransformOptions'] = {
    __proto__: null,
    optimize: optimize || undefined,
    engine,
    clientBoundaries,
    preserveEnvVars: preserveEnvVars || undefined,
    // Use string to match the query param behavior.
    asyncRoutes: asyncRoutes ? String(asyncRoutes) : undefined,
    environment,
    baseUrl: baseUrl || undefined,
    routerRoot,
    bytecode: bytecode || undefined,
    reactCompiler: reactCompiler || undefined,
    dom: domRoot,
  };

  // Iterate and delete undefined values
  for (const key in customTransformOptions) {
    if (customTransformOptions[key] === undefined) {
      delete customTransformOptions[key];
    }
  }

  const bundleOptions: Partial<ExpoMetroBundleOptions> = {
    platform,
    entryFile: mainModuleName,
    dev,
    minify: minify ?? !dev,
    inlineSourceMap: inlineSourceMap ?? false,
    lazy: (!isExporting && lazy) || undefined,
    unstable_transformProfile: isHermes ? 'hermes-stable' : 'default',
    customTransformOptions,
    customResolverOptions: {
      __proto__: null,
      environment,
      exporting: isExporting || undefined,
    },
    sourceMapUrl: fakeSourceMapUrl,
    sourceUrl: fakeSourceUrl,
    serializerOptions: {
      splitChunks,
      usedExports: usedExports || undefined,
      output: serializerOutput,
      includeSourceMaps: serializerIncludeMaps,
    },
  };

  return bundleOptions;
}

export function createBundleUrlPathFromExpoConfig(
  projectRoot: string,
  exp: ExpoConfig,
  options: Omit<ExpoMetroOptions, 'reactCompiler' | 'baseUrl' | 'routerRoot'>
): string {
  return createBundleUrlPath({
    ...options,
    reactCompiler: !!exp.experiments?.reactCompiler,
    baseUrl: getBaseUrlFromExpoConfig(exp),
    routerRoot: getRouterDirectoryModuleIdWithManifest(projectRoot, exp),
  });
}

export function createBundleUrlPath(options: ExpoMetroOptions): string {
  const queryParams = createBundleUrlSearchParams(options);
  return `/${encodeURI(options.mainModuleName.replace(/^\/+/, ''))}.bundle?${queryParams.toString()}`;
}

export function createBundleUrlSearchParams(options: ExpoMetroOptions): URLSearchParams {
  const {
    platform,
    mode,
    minify,
    environment,
    serializerOutput,
    serializerIncludeMaps,
    lazy,
    bytecode,
    engine,
    preserveEnvVars,
    asyncRoutes,
    baseUrl,
    routerRoot,
    reactCompiler,
    inlineSourceMap,
    isExporting,
    clientBoundaries,
    splitChunks,
    usedExports,
    optimize,
    domRoot,
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

  // We split bytecode from the engine since you could technically use Hermes without bytecode.
  // Hermes indicates the type of language features you want to transform out of the JS, whereas bytecode
  // indicates whether you want to use the Hermes bytecode format.
  if (engine) {
    queryParams.append('transform.engine', engine);
  }
  if (bytecode) {
    queryParams.append('transform.bytecode', String(bytecode));
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
  if (clientBoundaries?.length) {
    queryParams.append('transform.clientBoundaries', JSON.stringify(clientBoundaries));
  }
  if (routerRoot != null) {
    queryParams.append('transform.routerRoot', routerRoot);
  }
  if (reactCompiler) {
    queryParams.append('transform.reactCompiler', String(reactCompiler));
  }
  if (domRoot) {
    queryParams.append('transform.dom', domRoot);
  }

  if (environment) {
    queryParams.append('resolver.environment', environment);
    queryParams.append('transform.environment', environment);
  }

  if (isExporting) {
    queryParams.append('resolver.exporting', String(isExporting));
  }

  if (splitChunks) {
    queryParams.append('serializer.splitChunks', String(splitChunks));
  }
  if (usedExports) {
    queryParams.append('serializer.usedExports', String(usedExports));
  }
  if (optimize) {
    queryParams.append('transform.optimize', String(optimize));
  }
  if (serializerOutput) {
    queryParams.append('serializer.output', serializerOutput);
  }
  if (serializerIncludeMaps) {
    queryParams.append('serializer.map', String(serializerIncludeMaps));
  }
  if (engine === 'hermes') {
    queryParams.append('unstable_transformProfile', 'hermes-stable');
  }

  return queryParams;
}

/**
 * Convert all path separators to `/`, including on Windows.
 * Metro asumes that all module specifiers are posix paths.
 * References to directories can still be Windows-style paths in Metro.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#importing_features_into_your_script
 * @see https://github.com/facebook/metro/pull/1286
 */
export function convertPathToModuleSpecifier(pathLike: string) {
  return pathLike.replaceAll('\\', '/');
}
