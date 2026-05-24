import type { SerializerConfigT } from '@expo/metro/metro-config';
import type { Chunk } from './serializeChunks';
interface PrecomputeChunkFilenamesInput {
    chunks: Set<Chunk>;
    chunksByPath: Map<string, Chunk>;
    serializerConfig: Partial<SerializerConfigT>;
    recomputeChunkNames: boolean;
}
/** Precompute each chunk's emitted filename.
 *
 * Hashes each chunk's intrinsic source combined with the intrinsics of all
 * its transitively reachabl async chunks.
 */
export declare function precomputeChunkFilenames({ chunks, chunksByPath, serializerConfig, recomputeChunkNames, }: PrecomputeChunkFilenamesInput): Map<Chunk, string>;
export {};
