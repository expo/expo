/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig, AssetData } from '@expo/metro/metro';
import type { ConfigT } from '@expo/metro/metro-config';
import type { MixedOutput, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';

import getMetroAssets from '../transform-worker/getAssets';
import type { ExpoCustomTransformOptions } from '../transform-worker/types';
import { Chunk, getBaseUrlOption, getPlatformOption } from './chunking/Chunk';
import type { SerializeChunkOptions } from './chunking/chunkingStrategy';
import { createGranularChunkingStrategy } from './chunking/createGranularChunkingStrategy';
import {
  createLegacyChunkingStrategy,
  legacyChunkSerialization,
} from './chunking/createLegacyChunkingStrategy';
import type { ExpoSerializerOptions } from './fork/baseJSBundle';
import { getCssSerialAssets } from './getCssDeps';
import type { SerialAsset } from './serializerAssets';

export { Chunk, getSortedModules } from './chunking/Chunk';
export type { SerializeChunkOptions } from './chunking/chunkingStrategy';

type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;

export async function graphToSerialAssetsAsync(
  config: MetroConfig,
  serializeChunkOptions: SerializeChunkOptions,
  ...props: SerializerParameters
): Promise<{
  artifacts: SerialAsset[];
  assets: AssetData[];
}> {
  const [entryFile, preModules, graph, options] = props;

  const context = {
    serializerConfig: config.serializer ?? {},
    serializeChunkOptions,
    entryFile,
    preModules,
    graph,
    options,
  };
  const strategy =
    serializeChunkOptions.chunkingStrategy === 'granular'
      ? createGranularChunkingStrategy(context)
      : createLegacyChunkingStrategy(context);
  const jsAssets = await strategy.serializeAsync();

  const resources = await collectGraphResourcesAsync(config, entryFile, graph, options);
  return { artifacts: [...jsAssets, ...resources.artifacts], assets: resources.assets };
}

export function graphToSingleChunk(...props: SerializerParameters): Chunk {
  const [entryFile, preModules, graph, options] = props;
  const entry = graph.dependencies.get(entryFile);
  const chunk = new Chunk(
    entryFile,
    new Set(entry ? [entry] : []),
    graph,
    options,
    legacyChunkSerialization,
    false,
    false,
    true
  );
  chunk.deps = new Set(graph.dependencies.values());
  chunk.preModules = new Set(preModules);
  return chunk;
}

export async function collectGraphResourcesAsync(
  config: Partial<MetroConfig>,
  entryFile: string,
  graph: ReadOnlyGraph<MixedOutput>,
  options: ExpoSerializerOptions
): Promise<{ artifacts: SerialAsset[]; assets: AssetData[] }> {
  const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
    entryFile,
    projectRoot: options.projectRoot,
  });

  const baseUrl = getBaseUrlOption(graph, { serializerOptions: options.serializerOptions ?? {} });
  const assetPublicUrl = baseUrl.replace(/\/+$/, '') + '/assets';
  const platform = getPlatformOption(graph, options) ?? 'web';
  const customTransformOptions = graph.transformOptions?.customTransformOptions as
    | ExpoCustomTransformOptions
    | undefined;
  const isHosted = platform === 'web' || !!customTransformOptions?.hosted;
  const publicPath = isHosted ? `/assets?export_path=${assetPublicUrl}` : assetPublicUrl;

  // TODO: Convert to serial assets
  const metroAssets = await getMetroAssets(graph.dependencies, {
    processModuleFilter: options.processModuleFilter,
    assetPlugins: config.transformer?.assetPlugins ?? [],
    platform,
    projectRoot: options.projectRoot,
    publicPath,
    isHosted,
  });

  return {
    artifacts: cssDeps,
    assets: metroAssets,
  };
}
