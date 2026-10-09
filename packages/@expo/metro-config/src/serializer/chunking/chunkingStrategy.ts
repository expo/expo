import type { SerializerConfigT } from '@expo/metro/metro-config';
import type {
  MixedOutput,
  Module,
  ReadOnlyGraph,
  ResolvedDependency,
} from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';
import assert from 'assert';

import type { AsyncDependencyType } from '../../transform-worker/collect-dependencies';
import type { ExpoSerializerOptions } from '../fork/baseJSBundle';
import type { ChunkingStrategy, SerialAsset } from '../serializerAssets';
import type { SerializerConfigOptions } from '../withExpoSerializers';
import { Chunk } from './Chunk';
import { precomputeChunkFilenames } from './computeChunkFilenames';

export type SerializeChunkOptions = {
  includeSourceMaps: boolean;
  splitChunks: boolean;
  chunkingStrategy: ChunkingStrategy;
} & SerializerConfigOptions;

export type ChunkingContext = {
  serializerConfig: Partial<SerializerConfigT>;
  serializeChunkOptions: SerializeChunkOptions;
  entryFile: string;
  preModules: readonly Module[];
  graph: ReadOnlyGraph;
  options: ExpoSerializerOptions;
};

export type ChunkSerializationOptions = Partial<
  Parameters<typeof import('../fork/baseJSBundle').baseJSBundleWithDependencies>[3]
>;

type ChunkStrategySerializationOptions = Pick<
  ChunkSerializationOptions,
  | 'computedAsyncModulePaths'
  | 'includeAsyncPaths'
  | 'includeChunkCompletion'
  | 'unstable_getAsyncDependencyPath'
>;

export type ChunkingImplementation = {
  serializeAsync(): Promise<SerialAsset[]>;
  /**
   * Chunks referenced by emitted async URLs, used to calculate filename hashes.
   * Must match the targets used by getSerializationOptions.
   */
  getAsyncChunkTargets(chunk: Chunk, chunksByPath: Map<string, Chunk>): Set<Chunk>;
  /**
   * Options used before dependency filenames are known, including for filename hashing.
   * Final serialization also uses these as defaults.
   */
  getStableSerializationOptions(chunk: Chunk): ChunkStrategySerializationOptions;
  getSerializationOptions(
    chunk: Chunk,
    chunksByPath: Map<string, Chunk>,
    filenamesByChunk: Map<Chunk, string>
  ): ChunkStrategySerializationOptions;
  getMetadata(
    chunk: Chunk,
    filenamesByChunk: Map<Chunk, string>
  ): Pick<
    SerialAsset['metadata'],
    'chunkingStrategy' | 'entryPaths' | 'entryChunks' | 'modulePaths'
  >;
};

export function createChunkCollector(
  { graph, options, preModules: runtimePremodules }: ChunkingContext,
  strategy: ChunkingImplementation,
  chunks: Set<Chunk>,
  shouldTraverseDependency: (dependency: ResolvedDependency) => boolean
) {
  const chunksByEntryPath = new Map<string, Chunk>();
  return function collectChunk(
    entryPath: string,
    preModules: readonly Module[],
    isAsync: boolean = false,
    isEntry: boolean = false
  ): Chunk | undefined {
    const existingChunk = chunksByEntryPath.get(entryPath);
    if (existingChunk) return existingChunk;
    const entryModule = graph.dependencies.get(entryPath);
    if (!entryModule) return undefined;

    const entryChunk = new Chunk(
      entryPath,
      new Set([entryModule]),
      graph,
      options,
      strategy,
      isAsync,
      false,
      isEntry
    );

    entryChunk.preModules = new Set(preModules);
    // Register before walking dependencies so circular imports reuse this chunk.
    chunksByEntryPath.set(entryPath, entryChunk);
    chunks.add(entryChunk);

    function includeModule(entryModule: Module<MixedOutput>) {
      const splitChunks = entryChunk.options.serializerOptions?.splitChunks !== false;
      for (const dependency of entryModule.dependencies.values()) {
        const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
        const isWorker = asyncType === 'worker';
        if (!isResolvedDependency(dependency) || !shouldTraverseDependency(dependency)) {
          continue;
        } else if (
          asyncType &&
          // Workers require standalone bundles even when ordinary chunk splitting is disabled.
          (isWorker || splitChunks)
        ) {
          if (isWorker && options.includeAsyncPaths) {
            continue;
          }
          const asyncChunk = collectChunk(
            dependency.absolutePath,
            isWorker ? runtimePremodules : [],
            true,
            isWorker
          );

          // Workers must be self-sufficient chunks.
          if (isWorker) {
            assert(asyncChunk, `Worker chunk not found for: ${dependency.absolutePath}`);
            asyncChunk.seal();
          }
        } else {
          const module = graph.dependencies.get(dependency.absolutePath);
          if (module) {
            // Prevent circular dependencies from creating infinite loops.
            if (!entryChunk.deps.has(module)) {
              entryChunk.deps.add(module);
              includeModule(module);
            }
          }
        }
      }
    }

    includeModule(entryModule);
    return entryChunk;
  };
}

export function createRuntimeChunk(
  entryChunk: Chunk,
  chunks: Set<Chunk>,
  strategy: ChunkingImplementation,
  requiredBy: Iterable<Chunk> = chunks
): void {
  const runtimeChunk = new Chunk(
    '/__expo-metro-runtime.js',
    new Set(),
    entryChunk.graph,
    entryChunk.options,
    strategy,
    false,
    true
  );

  // All premodules (including metro-runtime) should load first
  for (const preModule of entryChunk.preModules) {
    runtimeChunk.preModules.add(preModule);
  }
  entryChunk.preModules = new Set();

  for (const chunk of requiredBy) {
    chunk.requiredChunks.add(runtimeChunk);
  }
  chunks.add(runtimeChunk);
}

function makeChunkByPathLookupMap(chunks: Set<Chunk>): Map<string, Chunk> {
  const chunkByPath = new Map<string, Chunk>();
  // First, we populate chunks with entry module paths
  for (const chunk of chunks) {
    for (const entry of chunk.entries) {
      if (!chunkByPath.has(entry.path)) {
        chunkByPath.set(entry.path, chunk);
      }
    }
  }
  // We then populate the chunks' module paths, excluding sealed chunks...
  for (const chunk of chunks) {
    if (!chunk.sealed) {
      for (const module of chunk.deps) {
        if (!chunkByPath.has(module.path)) {
          chunkByPath.set(module.path, chunk);
        }
      }
    }
  }
  // ...then populate with missing paths from sealed chunks.
  // This gives precedence for modules from unsealed chunks after entry modules
  for (const chunk of chunks) {
    if (chunk.sealed) {
      for (const module of chunk.deps) {
        if (!chunkByPath.has(module.path)) {
          chunkByPath.set(module.path, chunk);
        }
      }
    }
  }
  return chunkByPath;
}

export async function serializeChunksAsync(
  chunks: Set<Chunk>,
  { serializerConfig, serializeChunkOptions, options }: ChunkingContext
): Promise<SerialAsset[]> {
  const chunksByPath = makeChunkByPathLookupMap(chunks);
  const filenamesByChunk = precomputeChunkFilenames({
    chunks,
    chunksByPath,
    serializerConfig,
    recomputeChunkNames: !!options.serializerOptions?.exporting,
  });
  const assets = await Promise.all(
    [...chunks].map((chunk) =>
      chunk.serializeToAssetsAsync(
        serializerConfig,
        chunksByPath,
        filenamesByChunk,
        serializeChunkOptions
      )
    )
  );
  return assets.flat();
}
