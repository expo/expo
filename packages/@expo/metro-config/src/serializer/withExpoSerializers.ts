/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig } from '@expo/metro/metro';
import type { Module, ReadOnlyGraph, MixedOutput } from '@expo/metro/metro/DeltaBundler';
import { sourceMapString } from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapString';
import type { SerializerOptions } from '@expo/metro/metro/DeltaBundler/types';
import bundleToString from '@expo/metro/metro/lib/bundleToString';
import type { ConfigT, InputConfigT } from '@expo/metro/metro-config';
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';

import { stringToUUID } from './debugId';
import {
  environmentVariableSerializerPlugin,
  serverPreludeSerializerPlugin,
} from './environmentVariableSerializerPlugin';
import { ExpoSerializerOptions, baseJSBundle } from './fork/baseJSBundle';
import { reconcileTransformSerializerPlugin } from './reconcileTransformSerializerPlugin';
import { createRscSerializerPlugin } from './rscSerializerPlugin';
import { getSortedModules, graphToSerialAssetsAsync } from './serializeChunks';
import { SerialAsset } from './serializerAssets';
import { treeShakeSerializer } from './treeShakeSerializerPlugin';
import { env } from '../env';

export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

export type SerializerParameters = [
  string,
  readonly Module[],
  ReadOnlyGraph,
  ExpoSerializerOptions,
];

export type SerializerConfigOptions = {
  /** Project root for RSC stable ID resolution */
  projectRoot?: string;
  unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
    graph: ReadOnlyGraph<MixedOutput>;
    premodules: Module[];
    debugId?: string;
  }) => Module[])[];
};

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (
  ...props: SerializerParameters
) => SerializerParameters | Promise<SerializerParameters>;

export function withExpoSerializers<Config extends InputConfigT = InputConfigT>(
  config: Config,
  options: SerializerConfigOptions = {}
): Config {
  const processors: SerializerPlugin[] = [];
  processors.push(serverPreludeSerializerPlugin);
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(environmentVariableSerializerPlugin);
  }

  // Then tree-shake the modules.
  processors.push(treeShakeSerializer);

  // Then finish transforming the modules from AST to JS.
  // This must run before RSC plugin since reconcile regenerates code from AST
  // and would overwrite any code changes made by RSC plugin.
  processors.push(reconcileTransformSerializerPlugin);

  // Resolve RSC deferred stable IDs AFTER reconcile has generated final code.
  // The Babel transform sets metadata with deferred IDs, and this plugin:
  // 1. Resolves deferred IDs to stable IDs in metadata
  // 2. Rewrites the actual JS code to replace deferred ID strings
  if (options.projectRoot) {
    processors.push(
      createRscSerializerPlugin({
        projectRoot: options.projectRoot,
        debug: env.EXPO_DEBUG,
      })
    );
  }

  return withSerializerPlugins(config, processors, options);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerializerPlugins<Config extends InputConfigT = InputConfigT>(
  config: Config,
  processors: SerializerPlugin[],
  options: SerializerConfigOptions = {}
): Config {
  const expoSerializer = createSerializerFromSerialProcessors(
    config,
    processors,
    config.serializer?.customSerializer ?? null,
    options
  );

  // We can't object-spread the config, it loses the reference to the original config
  // Meaning that any user-provided changes are not propagated to the serializer config

  // @ts-expect-error TODO(cedric): it's a read only property, but we can actually write it
  config.serializer ??= {};
  // @ts-expect-error TODO(cedric): it's a read only property, but we can actually write it
  config.serializer.customSerializer = expoSerializer;

  return config;
}

export function createDefaultExportCustomSerializer(
  config: Partial<MetroConfig>,
  configOptions: SerializerConfigOptions = {}
): Serializer {
  return async (
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph<MixedOutput>,
    inputOptions: SerializerOptions<MixedOutput>
  ): Promise<string | { code: string; map: string }> => {
    // NOTE(@kitten): My guess is that this was supposed to always be disabled for `node` since we set `hot: true` manually for it
    const isPossiblyDev =
      graph.transformOptions.dev ||
      graph.transformOptions.customTransformOptions?.environment === 'node';
    // TODO: This is a temporary solution until we've converged on using the new serializer everywhere.
    const enableDebugId = inputOptions.inlineSourceMap !== true && !isPossiblyDev;

    const context = {
      platform: graph.transformOptions?.platform,
      environment: graph.transformOptions?.customTransformOptions?.environment ?? 'client',
    };

    const options: SerializerOptions<MixedOutput> = {
      ...inputOptions,
      createModuleId: (moduleId, ...props) => {
        if (props.length > 0) {
          return inputOptions.createModuleId(moduleId, ...props);
        }

        return inputOptions.createModuleId(
          moduleId,
          // @ts-expect-error: context is added by Expo and not part of the upstream Metro implementation.
          context
        );
      },
    };

    let debugId: string | undefined;
    const loadDebugId = () => {
      if (!enableDebugId || debugId) {
        return debugId;
      }

      // TODO: Perform this cheaper.
      const bundle = baseJSBundle(entryPoint, preModules, graph, {
        ...options,
        debugId: undefined,
      });
      const outputCode = bundleToString(bundle).code;
      debugId = stringToUUID(outputCode);
      return debugId;
    };

    let premodulesToBundle = [...preModules];

    let bundleCode: string | null = null;
    let bundleMap: string | null = null;

    // Only invoke the custom serializer if it's not our serializer
    // We write the Expo serializer back to the original config object, possibly falling into recursive loops
    const originalCustomSerializer = unwrapOriginalSerializer(config.serializer?.customSerializer);
    if (originalCustomSerializer) {
      const bundle = await originalCustomSerializer(entryPoint, premodulesToBundle, graph, options);
      if (typeof bundle === 'string') {
        bundleCode = bundle;
      } else {
        bundleCode = bundle.code;
        bundleMap = bundle.map;
      }
    } else {
      const debugId = loadDebugId();
      if (configOptions.unstable_beforeAssetSerializationPlugins) {
        for (const plugin of configOptions.unstable_beforeAssetSerializationPlugins) {
          premodulesToBundle = plugin({ graph, premodules: [...premodulesToBundle], debugId });
        }
      }
      bundleCode = bundleToString(
        baseJSBundle(entryPoint, premodulesToBundle, graph, {
          ...options,
          debugId,
        })
      ).code;
    }

    // For RSC client boundary chunks: append registration code so the module
    // can be resolved by stable ID after the chunk is loaded.
    // This enables dynamic loading of client boundaries without requiring
    // them to be known at build time.
    if (options.sourceUrl) {
      const sourceUrl = isJscSafeUrl(options.sourceUrl)
        ? toNormalUrl(options.sourceUrl)
        : options.sourceUrl;
      const parsed = new URL(sourceUrl, 'http://expo.dev');
      const rscStableId = parsed.searchParams.get('rscStableId');

      if (rscStableId && bundleCode) {
        // Get the module ID for the entry point module
        const entryModuleId = options.createModuleId(entryPoint);
        // Append registration code to allow __webpack_require__(stableId) to work
        bundleCode += `\n;typeof __expo_rsc_register__==="function"&&__expo_rsc_register__(${JSON.stringify(rscStableId)},${JSON.stringify(entryModuleId)});`;
      }
    }

    const getEnsuredMaps = () => {
      bundleMap ??= sourceMapString(
        [...premodulesToBundle, ...getSortedModules([...graph.dependencies.values()], options)],
        {
          // TODO: Surface this somehow.
          excludeSource: false,
          // excludeSource: options.serializerOptions?.excludeSource,
          processModuleFilter: options.processModuleFilter,
          shouldAddToIgnoreList: options.shouldAddToIgnoreList,
        }
      );

      return bundleMap;
    };

    if (!bundleMap && options.sourceUrl) {
      const url = isJscSafeUrl(options.sourceUrl)
        ? toNormalUrl(options.sourceUrl)
        : options.sourceUrl;
      const parsed = new URL(url, 'http://expo.dev');
      // Is dev server request for source maps...
      if (parsed.pathname.endsWith('.map')) {
        return {
          code: bundleCode,
          map: getEnsuredMaps(),
        };
      }
    }

    if (isPossiblyDev) {
      if (bundleMap == null) {
        return bundleCode;
      }
      return {
        code: bundleCode,
        map: bundleMap,
      };
    }

    // Exports....

    bundleMap ??= getEnsuredMaps();

    if (enableDebugId) {
      const mutateSourceMapWithDebugId = (sourceMap: string) => {
        // NOTE: debugId isn't required for inline source maps because the source map is included in the same file, therefore
        // we don't need to disambiguate between multiple source maps.
        const sourceMapObject = JSON.parse(sourceMap);
        sourceMapObject.debugId = loadDebugId();
        // NOTE: Sentry does this, but bun does not.
        // sourceMapObject.debug_id = debugId;
        return JSON.stringify(sourceMapObject);
      };

      return {
        code: bundleCode,
        map: mutateSourceMapWithDebugId(bundleMap),
      };
    }

    return {
      code: bundleCode,
      map: bundleMap,
    };
  };
}

function getDefaultSerializer(
  config: MetroConfig,
  fallbackSerializer?: Serializer | null,
  configOptions: SerializerConfigOptions = {}
): Serializer {
  const defaultSerializer =
    fallbackSerializer ?? createDefaultExportCustomSerializer(config, configOptions);

  const expoSerializer = async (
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph<MixedOutput>,
    inputOptions: ExpoSerializerOptions
  ): Promise<string | { code: string; map: string }> => {
    const context = {
      platform: graph.transformOptions?.platform,
      environment: graph.transformOptions?.customTransformOptions?.environment ?? 'client',
    };

    const options: ExpoSerializerOptions = {
      ...inputOptions,
      createModuleId: (moduleId, ...props) => {
        if (props.length > 0) {
          return inputOptions.createModuleId(moduleId, ...props);
        }
        return inputOptions.createModuleId(
          moduleId,
          // @ts-expect-error: context is added by Expo and not part of the upstream Metro implementation.
          context
        );
      },
    };

    const customSerializerOptions = inputOptions.serializerOptions;

    // Custom options can only be passed outside of the dev server, meaning
    // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
    const supportsNonSerialReturn = !!customSerializerOptions?.output;

    const serializerOptions = (() => {
      if (customSerializerOptions) {
        return {
          outputMode: customSerializerOptions.output,
          splitChunks: customSerializerOptions.splitChunks,
          usedExports: customSerializerOptions.usedExports,
          includeSourceMaps: customSerializerOptions.includeSourceMaps,
        };
      }
      if (options.sourceUrl) {
        const sourceUrl = isJscSafeUrl(options.sourceUrl)
          ? toNormalUrl(options.sourceUrl)
          : options.sourceUrl;

        const url = new URL(sourceUrl, 'https://expo.dev');

        return {
          outputMode: url.searchParams.get('serializer.output'),
          usedExports: url.searchParams.get('serializer.usedExports') === 'true',
          splitChunks: url.searchParams.get('serializer.splitChunks') === 'true',
          includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
        };
      }
      return null;
    })();

    if (serializerOptions?.outputMode !== 'static') {
      return defaultSerializer(entryPoint, preModules, graph, options);
    }

    // Mutate the serializer options with the parsed options.
    options.serializerOptions = {
      ...options.serializerOptions,
      ...serializerOptions,
    };

    const assets = await graphToSerialAssetsAsync(
      config,
      {
        includeSourceMaps: !!serializerOptions.includeSourceMaps,
        splitChunks: !!serializerOptions.splitChunks,
        ...configOptions,
      },
      entryPoint,
      preModules,
      graph,

      options
    );

    if (supportsNonSerialReturn) {
      // @ts-expect-error: this is future proofing for adding assets to the output as well.
      return assets;
    }

    return JSON.stringify(assets);
  };

  return Object.assign(expoSerializer, { __expoSerializer: true });
}

export function createSerializerFromSerialProcessors(
  config: MetroConfig,
  processors: (SerializerPlugin | undefined)[],
  originalSerializer: Serializer | null,
  options: SerializerConfigOptions = {}
): Serializer {
  const finalSerializer = getDefaultSerializer(config, originalSerializer, options);

  return wrapSerializerWithOriginal(
    originalSerializer,
    async (...props: SerializerParameters): ReturnType<Serializer> => {
      for (const processor of processors) {
        if (processor) {
          props = await processor(...props);
        }
      }

      return finalSerializer(...props);
    }
  );
}

function wrapSerializerWithOriginal(original: Serializer | null, expo: Serializer) {
  return Object.assign(expo, { __originalSerializer: original });
}

function unwrapOriginalSerializer(serializer?: Serializer | null) {
  if (!serializer || !('__originalSerializer' in serializer)) return null;
  return serializer.__originalSerializer as Serializer | null;
}

export { SerialAsset };
