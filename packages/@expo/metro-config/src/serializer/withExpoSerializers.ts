/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import { MetroConfig, MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import { ConfigT, InputConfigT } from 'metro-config';

import { stringToUUID } from './debugId';
import {
  environmentVariableSerializerPlugin,
  serverPreludeSerializerPlugin,
} from './environmentVariableSerializerPlugin';
import { ExpoSerializerOptions, baseJSBundle } from './fork/baseJSBundle';
import { getSortedModules, graphToSerialAssetsAsync } from './serializeChunks';
import { SerialAsset } from './serializerAssets';
import { env } from '../env';

export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

export type SerializerParameters = [
  string,
  readonly Module[],
  ReadOnlyGraph,
  ExpoSerializerOptions,
];

export type SerializerConfigOptions = {
  unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
    graph: ReadOnlyGraph<MixedOutput>;
    premodules: Module[];
    debugId?: string;
  }) => Module[])[];
};

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;

export function withExpoSerializers(
  config: InputConfigT,
  options: SerializerConfigOptions = {}
): InputConfigT {
  const processors: SerializerPlugin[] = [];
  processors.push(serverPreludeSerializerPlugin);
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(environmentVariableSerializerPlugin);
  }

  return withSerializerPlugins(config, processors, options);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerializerPlugins(
  config: InputConfigT,
  processors: SerializerPlugin[],
  options: SerializerConfigOptions = {}
): InputConfigT {
  const originalSerializer = config.serializer?.customSerializer;

  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(
        config,
        processors,
        originalSerializer ?? null,
        options
      ),
    },
  };
}

export function createDefaultExportCustomSerializer(
  config: Partial<MetroConfig>,
  configOptions: SerializerConfigOptions = {}
): Serializer {
  return async (
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph<MixedOutput>,
    options: SerializerOptions<MixedOutput>
  ): Promise<string | { code: string; map: string }> => {
    const isPossiblyDev = graph.transformOptions.hot;
    // TODO: This is a temporary solution until we've converged on using the new serializer everywhere.
    const enableDebugId = options.inlineSourceMap !== true && !isPossiblyDev;

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

    if (config.serializer?.customSerializer) {
      const bundle = await config.serializer?.customSerializer(
        entryPoint,
        premodulesToBundle,
        graph,
        options
      );
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

    if (!bundleMap) {
      bundleMap = sourceMapString(
        [...premodulesToBundle, ...getSortedModules([...graph.dependencies.values()], options)],
        {
          // TODO: Surface this somehow.
          excludeSource: false,
          // excludeSource: options.serializerOptions?.excludeSource,
          processModuleFilter: options.processModuleFilter,
          shouldAddToIgnoreList: options.shouldAddToIgnoreList,
        }
      );
    }

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

  return async (
    ...props: SerializerParameters
  ): Promise<string | { code: string; map: string }> => {
    const [, , , options] = props;

    const customSerializerOptions = options.serializerOptions;

    // Custom options can only be passed outside of the dev server, meaning
    // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
    const supportsNonSerialReturn = !!customSerializerOptions?.output;

    const serializerOptions = (() => {
      if (customSerializerOptions) {
        return {
          outputMode: customSerializerOptions.output,
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
          includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
        };
      }
      return null;
    })();

    if (serializerOptions?.outputMode !== 'static') {
      return defaultSerializer(...props);
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
        ...configOptions,
      },
      ...props
    );

    if (supportsNonSerialReturn) {
      // @ts-expect-error: this is future proofing for adding assets to the output as well.
      return assets;
    }

    return JSON.stringify(assets);
  };
}

export function createSerializerFromSerialProcessors(
  config: MetroConfig,
  processors: (SerializerPlugin | undefined)[],
  originalSerializer: Serializer | null,
  options: SerializerConfigOptions = {}
): Serializer {
  const finalSerializer = getDefaultSerializer(config, originalSerializer, options);
  return (...props: SerializerParameters): ReturnType<Serializer> => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }

    return finalSerializer(...props);
  };
}

export { SerialAsset };
