import getInlineSourceMappingURL from '@expo/metro/metro/DeltaBundler/Serializers/helpers/getInlineSourceMappingURL';

import type { SerialAsset } from './serializerAssets';

type SourceMap = { source: string; debugId?: string };
type BundleAnnotations = { sourceMapUrl?: string | null; debugId?: string };

export const TRAILING_BUNDLE_ANNOTATIONS =
  /((?:^|\n)\/\/# (?:sourceMappingURL|sourceURL|debugId)=[^\n]*)+\s*$/;

export function replaceSourceMapUrl(source: string, url: string): string {
  return source.replace(TRAILING_BUNDLE_ANNOTATIONS, (annotations) =>
    annotations.replace(/(^|\n)(\/\/# sourceMappingURL=)[^\r\n]*/g, '$1$2' + url)
  );
}

export async function serializeJavaScriptArtifactsAsync({
  includeSourceMaps,
  inlineSourceMap,
  sourceMapUrl,
  debugId,
  getSourceMap,
  artifact,
}: {
  includeSourceMaps: boolean;
  inlineSourceMap: boolean;
  sourceMapUrl?: string | null;
  debugId?: string;
  getSourceMap: () => SourceMap | Promise<SourceMap>;
  artifact: SerialAsset | ((annotations: BundleAnnotations) => SerialAsset);
}): Promise<SerialAsset[]> {
  const map = includeSourceMaps || inlineSourceMap ? await getSourceMap() : undefined;
  const annotations = {
    sourceMapUrl: inlineSourceMap ? getInlineSourceMappingURL(map!.source) : sourceMapUrl,
    debugId: inlineSourceMap ? undefined : (map?.debugId ?? debugId),
  };
  // A producer owns annotation emission so Metro can still filter annotation modules.
  const asset =
    typeof artifact === 'function'
      ? artifact(annotations)
      : {
          ...artifact,
          source:
            artifact.source +
            (annotations.sourceMapUrl ? '\n//# sourceMappingURL=' + annotations.sourceMapUrl : '') +
            (annotations.debugId != null ? '\n//# debugId=' + annotations.debugId : ''),
        };
  const artifacts = [asset];
  if (includeSourceMaps && !inlineSourceMap) {
    artifacts.push({
      filename: asset.filename + '.map',
      originFilename: asset.originFilename,
      type: 'map',
      metadata: {},
      source: map!.source,
    });
  }
  return artifacts;
}
