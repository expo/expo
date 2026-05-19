import type { SerializerConfigT } from '@expo/metro/metro-config';

import type { Chunk } from './serializeChunks';

const EMPTY_SET: ReadonlySet<Chunk> = new Set();

export function precomputeChunkFilenames(
  chunks: Chunk[],
  serializerConfig: Partial<SerializerConfigT>,
  recomputeChunkNames: boolean
): Map<Chunk, string> {
  // When not exporting, chunk.getFilename contains no hash
  if (!recomputeChunkNames) {
    return new Map(chunks.map((chunk) => [chunk, chunk.name]));
  }

  const intrinsicSrc = new Map<Chunk, string>();
  const intrinsicHash = new Map<Chunk, string>();
  for (const chunk of chunks) {
    const src = chunk.getStableChunkSource(serializerConfig);
    intrinsicSrc.set(chunk, src);
    intrinsicHash.set(chunk, chunk.getFilename(src));
  }

  const reachable = new Map<Chunk, ReadonlySet<Chunk>>();
  const computeReachable = (chunk: Chunk, inProgress: Set<Chunk>): ReadonlySet<Chunk> => {
    const cached = reachable.get(chunk);
    if (cached) return cached;
    // Cycle back-edge: bail without caching so we don't pin a partial set as final.
    if (inProgress.has(chunk)) return EMPTY_SET;
    inProgress.add(chunk);
    const result = new Set<Chunk>();
    for (const target of chunk.getAsyncChunkTargets(chunks)) {
      if (target !== chunk) result.add(target);
      for (const transitive of computeReachable(target, inProgress)) {
        if (transitive !== chunk) result.add(transitive);
      }
    }
    inProgress.delete(chunk);
    reachable.set(chunk, result);
    return result;
  };

  const filenames = new Map<Chunk, string>();
  for (const chunk of chunks) {
    const reach = computeReachable(chunk, new Set());
    const parts: string[] = [intrinsicSrc.get(chunk)!];
    for (const candidate of chunks) {
      if (reach.has(candidate)) parts.push(intrinsicHash.get(candidate)!);
    }
    filenames.set(chunk, chunk.getFilename(parts.join('\n')));
  }
  return filenames;
}
