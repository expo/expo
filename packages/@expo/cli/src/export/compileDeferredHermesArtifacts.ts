import { transformJsAssetToHermesBytecodeAsync } from '@expo/metro-config/build/serializer/serializeChunks';
import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';

import type { ExportAssetMap } from './saveAssets';

/**
 * Compile the JS artifacts whose Hermes bytecode compilation the serializer deferred
 * (chunks that reference DOM components, see `metadata.deferredHermesBytecode`), and
 * move their `files` entries from `.js` / `.js.map` to `.hbc` / `.hbc.map`.
 *
 * `expo export` renames each DOM component html to its content hash inside the `files`
 * entry of the serialized JS, so the `files` entries are synced back onto the artifacts
 * before compiling. `export:embed` does not rename, which makes the sync a no-op there.
 */
export async function compileDeferredHermesArtifactsAsync({
  projectRoot,
  artifacts,
  files,
}: {
  projectRoot: string;
  artifacts: SerialAsset[];
  files: ExportAssetMap;
}): Promise<void> {
  for (const artifact of artifacts) {
    if (artifact.type !== 'js' || !artifact.metadata.deferredHermesBytecode) {
      continue;
    }
    delete artifact.metadata.deferredHermesBytecode;

    const jsFilename = artifact.filename;
    const jsEntry = files.get(jsFilename);
    if (typeof jsEntry?.contents === 'string') {
      artifact.source = jsEntry.contents;
    }

    const mapArtifact =
      artifacts.find((asset) => asset.type === 'map' && asset.filename === `${jsFilename}.map`) ??
      null;
    const mapFilename = mapArtifact?.filename;
    const mapEntry = mapFilename ? files.get(mapFilename) : undefined;
    if (mapArtifact && typeof mapEntry?.contents === 'string') {
      mapArtifact.source = mapEntry.contents;
    }

    await transformJsAssetToHermesBytecodeAsync({
      projectRoot,
      jsAsset: artifact,
      mapAsset: mapArtifact,
    });

    if (jsEntry) {
      files.delete(jsFilename);
      files.set(artifact.filename, { ...jsEntry, contents: artifact.source });
    }
    if (mapArtifact && mapEntry && mapFilename) {
      files.delete(mapFilename);
      files.set(mapArtifact.filename, { ...mapEntry, contents: mapArtifact.source });
    }
  }
}
