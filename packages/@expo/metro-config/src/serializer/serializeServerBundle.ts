import type { AssetData, MetroConfig } from '@expo/metro/metro';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import assert from 'assert';
import path from 'path';

import { toPosixPath } from '../utils/filePath';
import { getSortedModules } from './chunking/Chunk';
import { stringToUUID } from './debugId';
import {
  getExportFilename,
  getExportPathForDependencyWithOptions,
  getSiblingSourceMapUrl,
} from './exportPath';
import type { ExpoSerializerOptions } from './fork/baseJSBundle';
import { collectGraphResourcesAsync } from './serializeChunks';
import {
  serializeJavaScriptArtifactsAsync,
  TRAILING_BUNDLE_ANNOTATIONS,
} from './serializeJavaScriptArtifacts';
import { getModuleReferences, type SerialAsset } from './serializerAssets';
import {
  getSourceMapOptions,
  normalizeExportSourceMapPaths,
  normalizeSourceMapString,
  sourceMapStringNonBlocking,
} from './sourceMap';

/** Adapts legacy serializers' single bundles to server artifacts without reserializing their code. */
export async function serializeServerBundleAsync(
  bundle: unknown,
  entryPoint: string,
  preModules: readonly Module<MixedOutput>[],
  graph: ReadOnlyGraph<MixedOutput>,
  options: ExpoSerializerOptions,
  config: Partial<MetroConfig> = {}
): Promise<{ artifacts: SerialAsset[]; assets?: readonly AssetData[] }> {
  if (typeof bundle === 'string') {
    try {
      const parsed = JSON.parse(bundle);
      if (parsed && typeof parsed === 'object' && 'artifacts' in parsed) bundle = parsed;
    } catch {
      // Metro serializers may return JavaScript instead of Expo's JSON-encoded artifacts.
    }
  }
  if (bundle != null && typeof bundle === 'object' && 'artifacts' in bundle) {
    assert(Array.isArray(bundle.artifacts), 'Expected an array of serializer artifacts.');
    return bundle as { artifacts: SerialAsset[]; assets?: readonly AssetData[] };
  }
  assert(
    typeof bundle === 'string' ||
      (bundle != null &&
        typeof bundle === 'object' &&
        'code' in bundle &&
        typeof bundle.code === 'string' &&
        'map' in bundle &&
        typeof bundle.map === 'string'),
    'Expected serializer artifacts, JavaScript, or a { code, map } bundle.'
  );
  const singleBundle = bundle as string | { code: string; map: string };
  const serializerOptions = options.serializerOptions;
  const source = typeof singleBundle === 'string' ? singleBundle : singleBundle.code;
  const annotations = source.match(TRAILING_BUNDLE_ANNOTATIONS)?.[0] ?? '';
  const code = source.slice(0, source.length - annotations.length);
  const contentFilename = getExportPathForDependencyWithOptions(entryPoint, {
    src: code,
    platform: graph.transformOptions.platform ?? 'web',
    serverRoot: options.serverRoot,
  });
  const filename = getExportFilename(contentFilename, serializerOptions ?? {});
  const originFilename = toPosixPath(path.relative(options.projectRoot, entryPoint));
  const modules = [...graph.dependencies.values()];
  const artifacts = await serializeJavaScriptArtifactsAsync({
    includeSourceMaps: !!serializerOptions?.includeSourceMaps,
    inlineSourceMap: !!options.inlineSourceMap,
    sourceMapUrl: serializerOptions?.includeSourceMaps
      ? getSiblingSourceMapUrl(filename)
      : undefined,
    getSourceMap: async () => {
      const mapOptions = getSourceMapOptions(options, true);
      const encodedMap = annotations.match(
        /sourceMappingURL=data:application\/json[^,]*;base64,([^\s]+)/
      )?.[1];
      const suppliedMap =
        (typeof singleBundle !== 'string' && singleBundle.map) ||
        (encodedMap && Buffer.from(encodedMap, 'base64').toString());
      // Legacy string serializers may omit a map; only then fall back to the graph's mappings.
      const json =
        suppliedMap ||
        (await sourceMapStringNonBlocking(
          [
            ...(options.modulesOnly ? [] : preModules),
            ...getSortedModules([...graph.dependencies.values()], options),
          ],
          { ...mapOptions, flatten: false }
        ));
      const parsed = JSON.parse(json);
      const debugId =
        parsed.debugId ?? annotations.match(/debugId=([^\s]+)/)?.[1] ?? stringToUUID(code);
      // Generated maps already contain virtual paths that can resemble filesystem paths.
      const map = suppliedMap
        ? normalizeExportSourceMapPaths(parsed, options.serverRoot ?? options.projectRoot)
        : parsed;
      return { source: normalizeSourceMapString(map, { ...mapOptions, debugId }), debugId };
    },
    artifact: {
      filename,
      originFilename,
      type: 'js',
      source: code,
      metadata: {
        modulePaths: modules.map((module) => module.path),
        ...getModuleReferences(modules),
      },
    },
  });
  const resources = await collectGraphResourcesAsync(config, entryPoint, graph, options);
  return { artifacts: [...artifacts, ...resources.artifacts], assets: resources.assets };
}
