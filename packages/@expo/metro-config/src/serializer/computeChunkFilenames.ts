import type { SerializerConfigT } from '@expo/metro/metro-config';

import type { Chunk } from './serializeChunks';

interface TopologicalSet {
  getReachable(chunk: Chunk): Set<Chunk>;
}

/** Tarjan's SCC partition, exposing lazy transitive reachability per chunk */
const makeTopologicalSet = (chunks: Chunk[], chunksByPath: Map<string, Chunk>): TopologicalSet => {
  const discoveryIndex = new Map<Chunk, number>();
  const lowLink = new Map<Chunk, number>();
  const onPath = new Set<Chunk>();
  const path: Chunk[] = [];
  const groupOf = new Map<Chunk, Set<Chunk>>();
  let nextIndex = 0;

  const visit = (node: Chunk): void => {
    discoveryIndex.set(node, nextIndex);
    lowLink.set(node, nextIndex);
    nextIndex++;
    path.push(node);
    onPath.add(node);

    for (const neighbor of node.getAsyncChunkTargets(chunksByPath)) {
      if (!discoveryIndex.has(neighbor)) {
        visit(neighbor);
        lowLink.set(node, Math.min(lowLink.get(node)!, lowLink.get(neighbor)!));
      } else if (onPath.has(neighbor)) {
        lowLink.set(node, Math.min(lowLink.get(node)!, discoveryIndex.get(neighbor)!));
      }
    }

    // A node whose lowLink equals its own discoveryIndex is the root of an SCC
    if (lowLink.get(node) === discoveryIndex.get(node)) {
      const component = new Set<Chunk>();
      let member: Chunk;
      do {
        member = path.pop()!;
        onPath.delete(member);
        component.add(member);
        groupOf.set(member, component);
      } while (member !== node);
    }
  };

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx]!;
    if (!discoveryIndex.has(chunk)) {
      visit(chunk);
    }
  }

  const _closureCache = new Map<Set<Chunk>, Set<Chunk>>();

  const collect = (group: Set<Chunk>): Set<Chunk> => {
    const cached = _closureCache.get(group);
    if (cached) return cached;

    const closure = new Set<Chunk>(group);
    _closureCache.set(group, closure);
    for (const member of group) {
      for (const target of member.getAsyncChunkTargets(chunksByPath)) {
        const transitiveGroup = groupOf.get(target)!;
        if (transitiveGroup === group) continue;
        for (const reachable of collect(transitiveGroup)) {
          closure.add(reachable);
        }
      }
    }
    return closure;
  };

  return {
    getReachable(chunk) {
      return collect(groupOf.get(chunk)!);
    },
  };
};

interface Intrinsics {
  getSource(chunk: Chunk): string;
  getHash(chunk: Chunk): string;
}

/** Each chunk's intrinsic (no-async-paths) source and the corresponding filename hash */
const makeIntrinsics = (serializerConfig: Partial<SerializerConfigT>): Intrinsics => {
  const source = new Map<Chunk, string>();
  const hashes = new Map<Chunk, string>();
  const intrinsics = {
    getSource(chunk: Chunk) {
      let src = source.get(chunk);
      if (src === undefined) {
        src = chunk.getStableChunkSource(serializerConfig);
        source.set(chunk, src);
      }
      return src;
    },
    getHash(chunk: Chunk) {
      let hash = hashes.get(chunk);
      if (hash === undefined) {
        const src = intrinsics.getSource(chunk);
        hash = chunk.getFilename(src);
        hashes.set(chunk, hash);
      }
      return hash;
    },
  };
  return intrinsics;
};

const makeChunkByPathLookupMap = (chunks: Chunk[]): Map<string, Chunk> => {
  const chunkByPath = new Map<string, Chunk>();
  for (const chunk of chunks) {
    for (const module of chunk.deps) {
      if (!chunkByPath.has(module.path)) {
        chunkByPath.set(module.path, chunk);
      }
    }
  }
  return chunkByPath;
};

/** Precompute each chunk's emitted filename.
 *
 * Hashes each chunk's intrinsic source combined with the intrinsics of all
 * its transitively reachabl async chunks.
 */
export function precomputeChunkFilenames(
  chunks: Chunk[],
  serializerConfig: Partial<SerializerConfigT>,
  recomputeChunkNames: boolean
): Map<Chunk, string> {
  // When not exporting, chunk.getFilename ignores its input
  if (!recomputeChunkNames) {
    return new Map(chunks.map((chunk) => [chunk, chunk.name]));
  }

  const intrinsics = makeIntrinsics(serializerConfig);
  const chunksByPath = makeChunkByPathLookupMap(chunks);
  const topology = makeTopologicalSet(chunksByPath);

  const filenames = new Map<Chunk, string>();
  for (const chunk of chunks) {
    const parts = [intrinsics.getSource(chunk)];
    for (const candidate of topology.getReachable(chunk)) {
      if (candidate !== chunk) {
        parts.push(intrinsics.getHash(candidate));
      }
    }
    filenames.set(chunk, chunk.getFilename(parts.join('\n')));
  }
  return filenames;
}
