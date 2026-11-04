import assert from 'assert';
import crypto from 'crypto';

import { replaceSourceMapUrl } from './serializeJavaScriptArtifacts';
import type { SerialAsset } from './serializerAssets';

const md5 = (source: string) => crypto.createHash('md5').update(source).digest('hex');

/** Resolve content filenames and their references together, after DOM serialization. */
export function finalizeDomComponentArtifacts(artifacts: SerialAsset[]): void {
  const files = new Map(artifacts.map((artifact) => [artifact.filename, artifact]));
  const filenames = new Map<string, string>();
  const pending = new Set<string>();

  function finish(filename: string): string {
    const resolved = filenames.get(filename);
    if (resolved != null) return resolved;
    const artifact = files.get(filename);
    if (!artifact || artifact.type === 'css-external') return filename;
    assert(
      !pending.has(filename),
      'Cannot name cyclic DOM chunks by their final content. Disable bundle splitting with EXPO_NO_BUNDLE_SPLITTING=1.'
    );
    pending.add(filename);

    let source = artifact.source;
    const rewriteUrl = (url: string): string => {
      const dependency = [...files.keys()].find((name) => url === name || url.endsWith('/' + name));
      if (dependency == null) return url;
      const updated = url.slice(0, -dependency.length) + finish(dependency);
      source = source.replaceAll(JSON.stringify(url), JSON.stringify(updated));
      return updated;
    };
    for (const paths of Object.values(artifact.metadata.paths ?? {})) {
      for (const [id, target] of Object.entries(paths)) {
        paths[id] = typeof target === 'string' ? rewriteUrl(target) : target?.map(rewriteUrl);
      }
    }
    if (files.has(filename + '.map')) {
      source = replaceSourceMapUrl(source, encodeURIComponent(finish(filename + '.map')));
    }
    artifact.source = source;
    artifact.filename = `${md5(source)}.${artifact.type}`;
    filenames.set(filename, artifact.filename);
    pending.delete(filename);
    return artifact.filename;
  }

  for (const filename of files.keys()) finish(filename);
  for (const { metadata } of artifacts) {
    const rename = (filename: string) => filenames.get(filename) ?? filename;
    if (metadata.requires) metadata.requires = metadata.requires.map(rename);
    for (const [entry, chunks] of Object.entries(metadata.entryChunks ?? {})) {
      metadata.entryChunks![entry] = chunks.map(rename);
    }
  }
}

/** Resolve native DOM references before Hermes compilation, retaining source-map positions. */
export function finalizeNativeDomReferences(
  artifacts: SerialAsset[],
  reference: string,
  filename: string
): void {
  for (const artifact of artifacts) {
    if (
      artifact.type === 'js' &&
      Buffer.isBuffer(artifact.source) &&
      artifact.metadata.expoDomComponentReferences?.includes(reference)
    ) {
      throw new Error(
        `Cannot rename DOM assets in compiled Hermes bytecode (${artifact.filename}). ` +
          'Run `npx expo-doctor` to check package compatibility. Custom serializers must defer Hermes compilation until DOM filenames are resolved.'
      );
    }
  }
  const search = md5(reference) + '.html';
  assert(
    search.length === filename.length,
    'DOM references must retain their length to preserve source-map positions.'
  );
  for (const artifact of artifacts) {
    if (artifact.type === 'js' && !Buffer.isBuffer(artifact.source)) {
      artifact.source = artifact.source.replaceAll(search, filename);
    }
  }
}
