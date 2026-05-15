/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// A fork of the upstream babel-transformer that uses Expo-specific babel defaults
// and adds support for web and Node.js environments via `isServer` on the Babel caller.
import type {
  BabelTransformer,
  BabelTransformerArgs,
  BabelTransformerCacheKeyOptions,
} from '@expo/metro/metro-babel-transformer';
import { getCacheKey as getFileCacheKey } from '@expo/metro/metro-cache-key';
import assert from 'node:assert';
import path from 'node:path';

import type { TransformOptions } from './babel-core';
import { loadPartialConfigSync } from './babel-core';
import { loadBabelConfig, resolveBabelrcName } from './loadBabelConfig';
import { transformSync } from './transformSync';

export type ExpoBabelCaller = TransformOptions['caller'] & {
  babelRuntimeVersion?: string;
  metroSourceType?: 'script' | 'module' | 'asset';
  supportsReactCompiler?: boolean;
  isReactServer?: boolean;
  isHMREnabled?: boolean;
  isServer?: boolean;
  isNodeModule?: boolean;
  preserveEnvVars?: boolean;
  isDev?: boolean;
  asyncRoutes?: boolean;
  baseUrl?: string;
  engine?: string;
  bundler?: 'metro' | (string & object);
  platform?: string | null;
  routerRoot?: string;
  projectRoot: string;
  /** When true, indicates this bundle should contain only the loader export */
  isLoaderBundle?: boolean;
  /** When true, indicates this file is part of a DOM component bundle */
  isDomComponent?: boolean;
};

const debug = require('debug')('expo:metro-config:babel-transformer') as typeof console.log;

function isCustomTruthy(value: any): boolean {
  return String(value) === 'true';
}

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const memoizeWarning = memoize((message: string) => {
  debug(message);
});

function getBabelCaller({
  filename,
  options,
}: Pick<BabelTransformerArgs, 'filename' | 'options'>): ExpoBabelCaller {
  const isNodeModule = filename.includes('node_modules');
  const isReactServer = options.customTransformOptions?.environment === 'react-server';
  const isGenericServer = options.customTransformOptions?.environment === 'node';
  const isServer = isReactServer || isGenericServer;

  const routerRoot =
    typeof options.customTransformOptions?.routerRoot === 'string'
      ? decodeURI(options.customTransformOptions.routerRoot)
      : undefined;

  if (routerRoot == null) {
    memoizeWarning(
      'Warning: Missing transform.routerRoot option in Metro bundling request, falling back to `app` as routes directory. This can occur if you bundle without Expo CLI or expo/metro-config.'
    );
  }

  return {
    name: 'metro',
    bundler: 'metro',
    platform: options.platform,
    // Empower the babel preset to know the env it's bundling for.
    // Metro automatically updates the cache to account for the custom transform options.
    isServer,

    // Enable React Server Component rules for AST. The naming maps to the resolver property `--conditions=react-server`.
    isReactServer,

    // The base url to make requests from, used for hosting from non-standard locations.
    baseUrl:
      typeof options.customTransformOptions?.baseUrl === 'string'
        ? decodeURI(options.customTransformOptions.baseUrl)
        : '',

    // Ensure we always use a mostly-valid router root.
    routerRoot: routerRoot ?? 'app',

    isDev: options.dev,

    // This value indicates if the user has disabled the feature or not.
    // Other criteria may still cause the feature to be disabled, but all inputs used are
    // already considered in the cache key.
    preserveEnvVars: isCustomTruthy(options.customTransformOptions?.preserveEnvVars)
      ? true
      : undefined,
    asyncRoutes: isCustomTruthy(options.customTransformOptions?.asyncRoutes) ? true : undefined,
    // Pass the engine to babel so we can automatically transpile for the correct
    // target environment.
    engine: stringOrUndefined(options.customTransformOptions?.engine),

    // Provide the project root for accurately reading the Expo config.
    projectRoot: options.projectRoot,

    isNodeModule,

    // TODO(@kitten): Removed and the default; The `hot` parameter is now force-enabled in Metro
    // to align caching for `dev` with `hot` being enforced. Hence, we match this by forcing our
    // own caller flag to `true` for `babel-preset-expo`. However, `babel-preset-expo` is still
    // able to disable the React Refresh transform plugin for other runtimes and uses this flag
    // to identify Metro / React Refresh runtime targets
    isHMREnabled: true,

    // Pass on the input type. Scripts shall be transformed to avoid dependencies (imports/requires),
    // for example by polyfills or Babel runtime
    metroSourceType: options.type,

    // Set the standard Babel flag to disable ESM transformations.
    supportsStaticESM:
      isCustomTruthy(options.customTransformOptions?.optimize) || options.experimentalImportSupport,

    // Enable React compiler support in Babel.
    // TODO: Remove this in the future when compiler is on by default.
    supportsReactCompiler: isCustomTruthy(options.customTransformOptions?.reactCompiler)
      ? true
      : undefined,

    // When true, indicates this bundle should contain only the loader export.
    // Used by server-data-loaders-plugin to strip everything except the loader function.
    isLoaderBundle: isCustomTruthy(options.customTransformOptions?.isLoaderBundle)
      ? true
      : undefined,

    isDomComponent: options.customTransformOptions?.dom != null ? true : undefined,

    // This is picked up by `babel-preset-expo` if it's set, and overrides the minimum supported
    // `@babel/runtime` version that `@babel/plugin-transform-runtime` can assume is installed
    // This option should be set to the project's version of `@babel/runtime`, if it's installed directly
    babelRuntimeVersion:
      typeof options.enableBabelRuntime === 'string' ? options.enableBabelRuntime : undefined,
  };
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

const transform: BabelTransformer['transform'] = ({
  filename,
  src,
  options,
  // `plugins` is used for `functionMapBabelPlugin` from `metro-source-map`. Could make sense to move this to `babel-preset-expo` too.
  plugins,
}: BabelTransformerArgs): ReturnType<BabelTransformer['transform']> => {
  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : process.env.BABEL_ENV || 'production';

  try {
    const { enableBabelRCLookup } = options;
    const { exts, presets } = loadBabelConfig(options);

    const babelConfig: TransformOptions = {
      // ES modules require sourceType='module' but OSS may not always want that
      sourceType: 'unambiguous',

      // The output we want from Babel methods
      ast: true,
      code: false,
      // NOTE(EvanBacon): We split the parse/transform steps up to accommodate
      // Hermes parsing, but this defaults to cloning the AST which increases
      // the transformation time by a fair amount.
      // You get this behavior by default when using Babel's `transform` method directly.
      cloneInputAst: false,

      // Options for debugging
      cwd: options.projectRoot,
      filename,
      highlightCode: true,

      root: options.projectRoot, // Default value

      babelrcRoots: enableBabelRCLookup ? options.projectRoot : false, // Default value
      // NOTE(@kitten): This will and has always only searched `projectRoot`, excluding node_modules and other workspaces
      // As such, we'll only enable it when `enableBabelRCLookup` is explicitly enabled for non-node_modules
      babelrc: enableBabelRCLookup ? !filename.includes('node_modules') : false,
      // NOTE(@kitten): This used to duplicate the config file, which is already piped into `extends`
      // However, for deprecated/legacy behaviour, we'll still enable it when `enableBabelRCLookup` is explicitly enabled
      configFile: !!enableBabelRCLookup, // Otherwise duplicates our search below

      // Add the discovered config file
      extends: exts,
      presets,
      plugins,

      // NOTE(EvanBacon): We heavily leverage the caller functionality to mutate the babel config.
      // This compensates for the lack of a format plugin system in Metro. Users can modify the
      // all (most) of the transforms in their local Babel config.
      // This also helps us keep the transform layers small and focused on a single task. We can also use this to
      // ensure the Babel config caching is more accurate.
      // Additionally, by moving everything Babel-related to the Babel preset, it makes it easier for users to reason
      // about the requirements of an Expo project, making it easier to migrate to other transpilers in the future.
      caller: getBabelCaller({ filename, options }),
    };

    const result = transformSync(src, babelConfig, options);

    // The result from `transformFromAstSync` can be null (if the file is ignored)
    if (!result) {
      // BabelTransformer specifies that the `ast` can never be null but
      // the function returns here. Discovered when typing `BabelNode`.
      // @ts-expect-error: see https://github.com/facebook/react-native/blob/401991c3f073bf734ee04f9220751c227d2abd31/packages/react-native-babel-transformer/src/index.js#L220-L224
      return { ast: null };
    }

    assert(result.ast);
    return { ast: result.ast, metadata: result.metadata };
  } finally {
    // Restore the old process.env.BABEL_ENV
    if (OLD_BABEL_ENV == null) {
      // We have to treat this as a special case because writing undefined to
      // an environment variable coerces it to the string 'undefined'. To
      // unset it, we must delete it.
      // See https://github.com/facebook/metro/pull/446
      delete process.env.BABEL_ENV;
    } else {
      process.env.BABEL_ENV = OLD_BABEL_ENV;
    }
  }
};

/**
 * Generates a cache key component based on the user's Babel configuration files.
 * This uses Babel's loadPartialConfig to resolve which config files apply
 * to the project, and includes their contents in the cache key so that changes
 * to babel.config.js, .babelrc, or any file they reference will invalidate the
 * transform cache.
 *
 * This is called once by the main thread (not on worker instances).
 */
function getCacheKey(options?: BabelTransformerCacheKeyOptions): string {
  if (options?.projectRoot == null || options.enableBabelRCLookup === false) {
    return '';
  }

  // In Expo, we pass the `extendsBabelConfigPath` ourselves, but if we're not using this with the Expo CLI
  // we re-resolve the Babel config, same as in `loadBabelConfig`
  const configName = options.extendsBabelConfigPath ?? resolveBabelrcName(options.projectRoot);
  if (!configName) {
    return '';
  }

  const partialConfig = loadPartialConfigSync({
    cwd: options.projectRoot,
    root: options.projectRoot,
    extends: path.resolve(options.projectRoot, configName),
    configFile: false,
    babelrc: false,
  });

  const files = partialConfig?.files;
  if (files == null || files.size === 0) {
    return '';
  }

  return getFileCacheKey([...files].sort());
}

const babelTransformer: BabelTransformer = {
  transform,
  getCacheKey,
};

module.exports = babelTransformer;
