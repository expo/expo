import type { AssetData, MetroConfig } from '@expo/metro/metro';
import getInlineSourceMappingURL from '@expo/metro/metro/DeltaBundler/Serializers/helpers/getInlineSourceMappingURL';
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
import { getModuleReferences, type SerialAsset } from './serializerAssets';
import {
  getSourceMapOptions,
  normalizeSourceMapString,
  sourceMapStringNonBlocking,
} from './sourceMap';

/** Ensures server artifacts, preserving complete custom bundles instead of reserializing them. */
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
  const annotations =
    source.match(/((?:^|\n)\/\/# (?:sourceMappingURL|sourceURL|debugId)=[^\n]*)+\s*$/)?.[0] ?? '';
  // Only replace Metro's final entry invocation and trailing annotations, never embedded directives.
  let code = source
    .slice(0, source.length - annotations.length)
    .replace(/(^|\n)(__r\([^\n]*\);)\s*$/, '$1module.exports = $2');
  const contentFilename = getExportPathForDependencyWithOptions(entryPoint, {
    src: code,
    platform: graph.transformOptions.platform ?? 'web',
    serverRoot: options.serverRoot,
  });
  const filename = getExportFilename(contentFilename, serializerOptions ?? {});
  const originFilename = toPosixPath(path.relative(options.projectRoot, entryPoint));
  const artifacts: SerialAsset[] = [];
  if (serializerOptions?.includeSourceMaps || options.inlineSourceMap) {
    const excludeSource = serializerOptions?.excludeSource ?? !!options.excludeSource;
    const encodedMap = annotations.match(
      /sourceMappingURL=data:application\/json[^,]*;base64,([^\s]+)/
    )?.[1];
    const json =
      (typeof singleBundle !== 'string' && singleBundle.map) ||
      (encodedMap && Buffer.from(encodedMap, 'base64').toString()) ||
      (await sourceMapStringNonBlocking(
        [
          ...(options.modulesOnly ? [] : preModules),
          ...getSortedModules([...graph.dependencies.values()], options),
        ],
        { ...getSourceMapOptions(options, true), flatten: false }
      ));
    const parsed = JSON.parse(json);
    const debugId =
      parsed.debugId ?? annotations.match(/debugId=([^\s]+)/)?.[1] ?? stringToUUID(code);
    const mapSource = normalizeSourceMapString(parsed, { flatten: true, excludeSource, debugId });
    if (options.inlineSourceMap) {
      code += '\n//# sourceMappingURL=' + getInlineSourceMappingURL(mapSource);
    } else {
      code += '\n//# sourceMappingURL=' + getSiblingSourceMapUrl(filename);
      code += '\n//# debugId=' + debugId;
      artifacts.push({
        filename: filename + '.map',
        originFilename,
        type: 'map',
        source: mapSource,
        metadata: {},
      });
    }
  }
  const modules = [...graph.dependencies.values()];
  artifacts.unshift({
    filename,
    originFilename,
    type: 'js',
    source: code,
    metadata: {
      modulePaths: modules.map((module) => module.path),
      ...getModuleReferences(modules),
    },
  });
  const resources = await collectGraphResourcesAsync(config, entryPoint, graph, options);
  return { artifacts: [...artifacts, ...resources.artifacts], assets: resources.assets };
}
