import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import assert from 'node:assert';

import type { ExportAssetDescriptor, ExportAssetMap } from '../../../export/saveAssets';

export function getServerEntryArtifact(artifacts: SerialAsset[]): SerialAsset {
  const bundles = artifacts.filter(
    (artifact) => artifact.type === 'js' && !artifact.metadata?.isAsync
  );
  assert(
    bundles.length === 1,
    'Expected one server bundle. Server bundle splitting is not supported.'
  );
  return bundles[0]!;
}

export function persistServerArtifacts(
  artifacts: SerialAsset[],
  files: ExportAssetMap,
  descriptor: Partial<ExportAssetDescriptor> = {}
): string {
  const entry = getServerEntryArtifact(artifacts);
  for (const artifact of artifacts) {
    if (artifact.type === 'js' || artifact.type === 'map') {
      files.set(artifact.filename, {
        ...descriptor,
        contents: artifact.source,
        originFilename: artifact.originFilename,
        targetDomain: 'server',
      });
    }
  }
  return entry.filename;
}
