import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';
import assert from 'assert';

import type { ExpoSerializerOptions } from '../fork/baseJSBundle';
import type { SerialAsset } from '../serializerAssets';
import { Chunk, getBaseUrlOption } from './Chunk';
import {
  type ChunkingContext,
  type ChunkingImplementation,
  createChunkCollector,
  createChunkSerializer,
  createRuntimeChunk,
  pathToRegex,
} from './chunkingStrategy';

export function createLegacyChunkingStrategy(context: ChunkingContext): ChunkingImplementation {
  const { entryFile, preModules, graph, options } = context;
  const strategy: ChunkingImplementation = {
    async serializeAsync() {
      // Create chunks for splitting.
      const chunks = new Set<Chunk>();
      const gatherChunks = createChunkCollector(context, strategy);
      const entryChunks = gatherChunks(
        chunks,
        { test: pathToRegex(entryFile) },
        preModules,
        false,
        true
      );

      // TODO(@kitten): We know that the returned `entryChunks` should only have a single value
      // with `!isAsync` and matching `.hasAbsolutePath(entryFile)` due to us only starting with
      // an entry module. This is temporarily implicit and not enforced by an invariant
      const entryChunk = entryChunks.values().next().value;
      if (entryChunk) {
        removeEntryDepsFromAsyncChunks(entryChunk, chunks);

        const commonChunk = extractCommonChunk(chunks, graph, options, strategy);
        if (commonChunk) {
          entryChunk.requiredChunks.add(commonChunk);
          chunks.add(commonChunk);
        }

        deduplicateAgainstKnownChunks(chunks, entryChunk, commonChunk);
        removeEmptyChunks(chunks);

        if (commonChunk) {
          createRuntimeChunk(entryChunk, chunks, strategy);
        }
      }

      const serializeChunk = createChunkSerializer(chunks, context);
      const assets: SerialAsset[] = [];
      await Promise.all(
        [...chunks].map(async (chunk) => {
          assets.push(...(await serializeChunk(chunk)));
        })
      );
      return assets;
    },
    getAsyncChunkTargets(chunk, chunksByPath) {
      const targets = new Set<Chunk>();
      if (options.includeAsyncPaths) return targets;
      for (const module of chunk.deps) {
        for (const dependency of module.dependencies.values()) {
          if (isResolvedDependency(dependency) && dependency.data.data.asyncType) {
            const target = chunksByPath.get(dependency.absolutePath);
            // Merges can leave async imports pointing at eagerly loaded chunks.
            if (target?.isAsync) targets.add(target);
          }
        }
      }
      return targets;
    },
    getStableSerializationOptions() {
      return {};
    },
    getSerializationOptions(chunk, chunksByPath, filenamesByChunk) {
      return {
        computedAsyncModulePaths: getComputedPathsForAsyncDependencies(
          chunk,
          chunksByPath,
          filenamesByChunk
        ),
      };
    },
    getMetadata(chunk) {
      return { modulePaths: [...chunk.deps].map((module) => module.path) };
    },
  };
  return strategy;
}

function getComputedPathsForAsyncDependencies(
  chunk: Chunk,
  chunksByPath: Map<string, Chunk>,
  filenamesByChunk: Map<Chunk, string>
) {
  const baseUrl = getBaseUrlOption(chunk.graph, chunk.options);
  // Only calculate production paths when all chunks are being exported.
  if (chunk.options.includeAsyncPaths) {
    return null;
  }
  const computedAsyncModulePaths: Record<string, string> = {};

  chunk.deps.forEach((module) => {
    module.dependencies.forEach((dependency) => {
      if (isResolvedDependency(dependency) && dependency.data.data.asyncType) {
        const chunkContainingModule = chunksByPath.get(dependency.absolutePath);
        assert(
          chunkContainingModule,
          'Chunk containing module not found: ' + dependency.absolutePath
        );

        if (chunkContainingModule.isAsync) {
          const moduleIdName = filenamesByChunk.get(chunkContainingModule);
          assert(
            moduleIdName,
            'Precomputed filename missing for async chunk: ' + chunkContainingModule.name
          );
          computedAsyncModulePaths![dependency.absolutePath] = (baseUrl ?? '/') + moduleIdName;
        }
      }
    });
  });
  return computedAsyncModulePaths;
}

function removeEntryDepsFromAsyncChunks(entryChunk: Chunk, chunks: Set<Chunk>): void {
  for (const chunk of chunks) {
    if (!chunk.sealed && !chunk.isEntry && chunk.isAsync) {
      for (const dep of chunk.deps) {
        if (entryChunk.deps.has(dep)) {
          // Remove the dependency from the async chunk since it will be loaded in the main chunk.
          chunk.deps.delete(dep);
        }
      }
    }
  }
}

function extractCommonChunk(
  chunks: Set<Chunk>,
  graph: ReadOnlyGraph,
  options: ExpoSerializerOptions,
  strategy: ChunkingImplementation
): Chunk | undefined {
  const toCompare = [...chunks.values()].filter((chunk) => !chunk.sealed);
  const commonDependencies = new Set<Module<MixedOutput>>();

  while (toCompare.length) {
    const chunk = toCompare.shift()!;
    for (const chunk2 of toCompare) {
      if (chunk !== chunk2 && chunk.isAsync && chunk2.isAsync) {
        for (const dep of chunk.deps) {
          if (chunk2.deps.has(dep)) {
            chunk.deps.delete(dep);
            chunk2.deps.delete(dep);
            commonDependencies.add(dep);
          }
        }
      }
    }
  }

  // If common dependencies were found, extract them to the shared chunk.
  if (commonDependencies.size) {
    return new Chunk('/__common.js', commonDependencies, graph, options, strategy, false, true);
  }

  return undefined;
}

function deduplicateAgainstKnownChunks(
  chunks: Set<Chunk>,
  entryChunk: Chunk,
  commonChunk: Chunk | undefined
): void {
  // TODO: Optimize this pass more.
  // Remove all dependencies from async chunks that are already in the common chunk.
  for (const chunk of chunks) {
    if (!chunk.sealed && !chunk.isEntry && chunk !== commonChunk) {
      for (const dep of chunk.deps) {
        if (entryChunk.deps.has(dep) || commonChunk?.deps.has(dep)) {
          chunk.deps.delete(dep);
        }
      }
    }
  }
}

function removeEmptyChunks(chunks: Set<Chunk>): void {
  for (const chunk of chunks) {
    if (!chunk.sealed && !chunk.isEntry && chunk.deps.size === 0) {
      chunks.delete(chunk);
    }
  }
}
