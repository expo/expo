import type { SerializerConfigT } from '@expo/metro/metro-config';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';
import assert from 'assert';

import type { AsyncDependencyType } from '../../transform-worker/collect-dependencies';
import type { ExpoSerializerOptions } from '../fork/baseJSBundle';
import type { SerialAsset } from '../serializerAssets';
import type { SerializerConfigOptions } from '../withExpoSerializers';
import { Chunk } from './Chunk';
import { precomputeChunkFilenames } from './computeChunkFilenames';

export type SerializeChunkOptions = {
  includeSourceMaps: boolean;
  splitChunks: boolean;
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

export type ChunkingImplementation = {
  serializeAsync(): Promise<SerialAsset[]>;
  getAsyncChunkTargets(chunk: Chunk, chunksByPath: Map<string, Chunk>): Set<Chunk>;
  getStableSerializationOptions(chunk: Chunk): ChunkSerializationOptions;
  getSerializationOptions(
    chunk: Chunk,
    chunksByPath: Map<string, Chunk>,
    filenamesByChunk: Map<Chunk, string>
  ): ChunkSerializationOptions;
  getMetadata(chunk: Chunk): Pick<SerialAsset['metadata'], 'modulePaths'>;
};

type ChunkSettings = {
  test: RegExp;
};

// Convert file paths to regex matchers.
export function pathToRegex(path: string) {
  // Escape regex special characters, except for '*'
  let regexSafePath = path.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');

  // Replace '*' with '.*' to act as a wildcard in regex
  regexSafePath = regexSafePath.replace(/\*/g, '.*');

  // Create a RegExp object with the modified string
  return new RegExp('^' + regexSafePath + '$');
}

function getEntryModulesForChunkSettings(
  graph: ReadOnlyGraph,
  settings: ChunkSettings
): Set<Module<MixedOutput>> {
  const modules = new Set<Module<MixedOutput>>();
  for (const entry of graph.dependencies) {
    if (settings.test.test(entry[0])) {
      modules.add(entry[1]);
    }
  }
  return modules;
}

function chunkIdForModules(modules: Iterable<Module>) {
  const modPaths: string[] = [];
  for (const mod of modules) modPaths.push(mod.path);
  return modPaths.sort().join('=>');
}

export function createChunkCollector(
  { graph, options, preModules: runtimePremodules }: ChunkingContext,
  strategy: ChunkingImplementation
) {
  return function gatherChunks(
    chunks: Set<Chunk>,
    settings: ChunkSettings,
    preModules: readonly Module[],
    isAsync: boolean = false,
    isEntry: boolean = false
  ): Set<Chunk> {
    const entryModules = getEntryModulesForChunkSettings(graph, settings);
    const entryChunks = new Set<Chunk>();
    if (!entryModules.size) {
      return entryChunks;
    }

    for (const chunk of chunks) {
      for (const entry of chunk.entries) {
        // Remove already processed entries
        if (entryModules.delete(entry)) {
          entryChunks.add(chunk);
        }
      }
      // Prevent processing the same entry file twice.
      if (!entryModules.size) {
        return entryChunks;
      }
    }

    const entryChunk = new Chunk(
      chunkIdForModules(entryModules),
      entryModules,
      graph,
      options,
      strategy,
      isAsync,
      false,
      isEntry
    );

    // Add all the pre-modules to the first chunk.
    if (preModules.length) {
      // On native, use the preModules in insert code in the entry chunk.
      for (const module of preModules.values()) {
        entryChunk.preModules.add(module);
      }
    }

    chunks.add(entryChunk);
    entryChunks.add(entryChunk);

    function includeModule(entryModule: Module<MixedOutput>) {
      const splitChunks = entryChunk.options.serializerOptions?.splitChunks !== false;
      for (const dependency of entryModule.dependencies.values()) {
        const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
        const isWorker = asyncType === 'worker';
        if (!isResolvedDependency(dependency)) {
          continue;
        } else if (
          asyncType &&
          // Workers require standalone bundles even when ordinary chunk splitting is disabled.
          (isWorker || splitChunks)
        ) {
          if (isWorker && options.includeAsyncPaths) {
            continue;
          }
          const asyncChunks = gatherChunks(
            chunks,
            { test: pathToRegex(dependency.absolutePath) },
            isWorker ? runtimePremodules : [],
            true,
            isWorker
          );

          // Seal all chunks that are for web workers, as these must be self-sufficient chunks
          if (isWorker) {
            assert(asyncChunks.size, `Worker chunk not found for: ${dependency.absolutePath}`);
            for (const chunk of asyncChunks) {
              chunk.seal();
            }
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

    for (const entryModule of entryModules) {
      includeModule(entryModule);
    }

    return entryChunks;
  };
}

export function createRuntimeChunk(
  entryChunk: Chunk,
  chunks: Set<Chunk>,
  strategy: ChunkingImplementation
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

  for (const chunk of chunks) {
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

export function createChunkSerializer(
  chunks: Set<Chunk>,
  { serializerConfig, serializeChunkOptions, options }: ChunkingContext
): (chunk: Chunk) => Promise<SerialAsset[]> {
  const chunksByPath = makeChunkByPathLookupMap(chunks);
  const filenamesByChunk = precomputeChunkFilenames({
    chunks,
    chunksByPath,
    serializerConfig,
    recomputeChunkNames: !!options.serializerOptions?.exporting,
  });
  return (chunk) =>
    chunk.serializeToAssetsAsync(
      serializerConfig,
      chunksByPath,
      filenamesByChunk,
      serializeChunkOptions
    );
}
