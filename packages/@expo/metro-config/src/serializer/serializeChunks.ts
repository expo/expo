/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig, AssetData } from '@expo/metro/metro';
import type { ConfigT } from '@expo/metro/metro-config';
import type { MixedOutput } from '@expo/metro/metro/DeltaBundler/types';

import getMetroAssets from '../transform-worker/getAssets';
import type { ExpoCustomTransformOptions } from '../transform-worker/types';
import { getBaseUrlOption, getPlatformOption } from './chunking/Chunk';
import type { SerializeChunkOptions } from './chunking/chunkingStrategy';
import { createLegacyChunkingStrategy } from './chunking/createLegacyChunkingStrategy';
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
  artifacts: SerialAsset[] | null;
  assets: AssetData[];
}> {
  const [entryFile, preModules, graph, options] = props;

  const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
    entryFile,
    projectRoot: options.projectRoot,
  });

  const context = {
    serializerConfig: config.serializer ?? {},
    serializeChunkOptions,
    entryFile,
    preModules,
    graph,
    options,
  };
  const strategy = createLegacyChunkingStrategy(context);
  const jsAssets = await strategy.serializeAsync();

  // TODO: Can this be anything besides true?
  const isExporting = true;
  const baseUrl = getBaseUrlOption(graph, { serializerOptions: serializeChunkOptions });
  const assetPublicUrl = (baseUrl.replace(/\/+$/, '') ?? '') + '/assets';
  const platform = getPlatformOption(graph, options) ?? 'web';
  const customTransformOptions = graph.transformOptions?.customTransformOptions as
    | ExpoCustomTransformOptions
    | undefined;
  const isHosted = platform === 'web' || (customTransformOptions?.hosted && isExporting);
  const publicPath = isExporting
    ? isHosted
      ? `/assets?export_path=${assetPublicUrl}`
      : assetPublicUrl
    : '/assets/?unstable_path=.';

  // TODO: Convert to serial assets
  // TODO: Disable this call dynamically in development since assets are fetched differently.
  const metroAssets = (await getMetroAssets(graph.dependencies, {
    processModuleFilter: options.processModuleFilter,
    assetPlugins: config.transformer?.assetPlugins ?? [],
    platform,
    projectRoot: options.projectRoot, // this._getServerRootDir(),
    publicPath,
    isHosted,
  })) as AssetData[];

  return {
    artifacts: [...jsAssets, ...cssDeps],
    assets: metroAssets,
  };
}
