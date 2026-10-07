import type { ResolvedDependency } from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';
import assert from 'assert';
import { createHash } from 'crypto';
import path from 'path';

import type { AsyncDependencyType } from '../../transform-worker/collect-dependencies';
import { toPosixPath } from '../../utils/filePath';
import { getChunkUrl } from '../exportPath';
import { Chunk, getBaseUrlOption } from './Chunk';
import {
  type ChunkingContext,
  type ChunkingImplementation,
  createChunkCollector,
  createRuntimeChunk,
  serializeChunksAsync,
} from './chunkingStrategy';
import {
  bitIndices,
  computeBitSetChunkPlan,
  type BitSetChunkPlan,
  type ChunkAtom,
} from './computeBitSetChunks';

export function createGranularChunkingStrategy(context: ChunkingContext): ChunkingImplementation {
  const { entryFile, graph, options } = context;
  let entryPathsByChunk = new Map<Chunk, string[]>();
  let requiredChunksByEntryPath = new Map<string, readonly Chunk[]>();
  let workerChunksByEntryPath = new Map<string, Chunk>();

  function getChunkTargets(chunk: Chunk, dependency: ResolvedDependency): readonly Chunk[] {
    const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
    if (asyncType == null || asyncType === 'weak') return [];
    if (asyncType === 'worker') {
      const workerChunk = workerChunksByEntryPath.get(dependency.absolutePath);
      assert(workerChunk, `Worker chunk not found for: ${dependency.absolutePath}`);
      return [workerChunk];
    }
    const targets = requiredChunksByEntryPath.get(dependency.absolutePath);
    assert(targets, `Granular async entry not found: ${dependency.absolutePath}`);
    return targets.filter((target) => target !== chunk);
  }

  const strategy: ChunkingImplementation = {
    async serializeAsync() {
      const entryModule = graph.dependencies.get(entryFile);
      assert(entryModule, `Granular entry is missing from the export graph: ${entryFile}`);
      const plan = computeBitSetChunkPlan([entryModule], graph, {
        isLazyBundle: options.includeAsyncPaths,
      });
      const pageChunks = createPageChunks(context, strategy, plan);
      const { chunks, entryChunk } = pageChunks;
      entryPathsByChunk = pageChunks.entryPathsByChunk;
      requiredChunksByEntryPath = assignEntryChunkRequirements(plan, pageChunks);
      const workers = collectWorkerChunks(context, strategy, plan.workerEntries);
      workerChunksByEntryPath = workers.chunksByEntryPath;
      for (const workerChunk of workers.chunks) chunks.add(workerChunk);
      if ([...chunks].some((chunk) => chunk.isAsync && !chunk.sealed)) {
        createRuntimeChunk(
          entryChunk,
          chunks,
          strategy,
          [...chunks].filter((chunk) => !chunk.sealed)
        );
      }
      const orderedChunks = new Set([
        entryChunk,
        ...[...chunks]
          .filter((chunk) => chunk !== entryChunk)
          .sort((a, b) => a.name.localeCompare(b.name, 'en')),
      ]);
      assignModuleIds(orderedChunks, options.createModuleId);
      return serializeChunksAsync(orderedChunks, context);
    },
    getAsyncChunkTargets(chunk) {
      const targets = new Set<Chunk>();
      if (options.includeAsyncPaths) return targets;
      for (const module of chunk.deps) {
        for (const dependency of module.dependencies.values()) {
          if (isResolvedDependency(dependency) && dependency.data.data.asyncType) {
            for (const target of getChunkTargets(chunk, dependency)) targets.add(target);
          }
        }
      }
      return targets;
    },
    getStableSerializationOptions(chunk) {
      return {
        includeChunkCompletion: chunk.isAsync && !chunk.sealed,
        includeAsyncPaths: false,
        unstable_getAsyncDependencyPath: undefined,
      };
    },
    getSerializationOptions(chunk, _chunksByPath, filenamesByChunk) {
      return {
        computedAsyncModulePaths: null,
        includeAsyncPaths: true,
        unstable_getAsyncDependencyPath: (dependency) => {
          const targets = getChunkTargets(chunk, dependency);
          const chunkUrls = targets.map((target) => {
            const filename = filenamesByChunk.get(target);
            assert(filename, `Precomputed filename missing for chunk: ${target.name}`);
            return getChunkUrl(getBaseUrlOption(graph, options), filename);
          });
          return (dependency.data.data.asyncType as AsyncDependencyType) === 'worker'
            ? (chunkUrls[0] ?? null)
            : chunkUrls.length
              ? chunkUrls
              : null;
        },
      };
    },
    getMetadata(chunk, filenamesByChunk) {
      const modulePaths = [...chunk.deps].map((module) => module.path);
      return {
        chunkingStrategy: 'granular',
        ...(chunk.isEntry &&
          !chunk.sealed && {
            entryChunks: Object.fromEntries(
              [...requiredChunksByEntryPath].map(([entryPath, requiredChunks]) => [
                entryPath,
                requiredChunks.map((requiredChunk) => {
                  const filename = filenamesByChunk.get(requiredChunk);
                  assert(filename, `Required chunk was not emitted: ${requiredChunk.name}`);
                  return filename;
                }),
              ])
            ),
          }),
        entryPaths: [...(entryPathsByChunk.get(chunk) ?? [])].sort(),
        modulePaths: chunk.sealed ? modulePaths : modulePaths.sort(),
      };
    },
  };
  return strategy;
}

type PageChunks = {
  chunks: Set<Chunk>;
  entryChunk: Chunk;
  entryPathsByChunk: Map<Chunk, string[]>;
  facadesByEntryPath: Map<string, Chunk>;
  chunksByAtom: Map<ChunkAtom, Chunk>;
};

function createPageChunks(
  { entryFile, preModules, graph, options }: ChunkingContext,
  strategy: ChunkingImplementation,
  plan: BitSetChunkPlan
): PageChunks {
  const chunks = new Set<Chunk>();
  const entryPathsByChunk = new Map<Chunk, string[]>();
  const facadesByEntryPath = new Map<string, Chunk>();
  for (const { module, kind } of plan.entryPoints) {
    const facade = new Chunk(
      module.path,
      new Set([module]),
      graph,
      options,
      strategy,
      kind !== 'initial',
      false,
      kind === 'initial'
    );
    facade.deps.clear();
    entryPathsByChunk.set(facade, [module.path]);
    facadesByEntryPath.set(module.path, facade);
    chunks.add(facade);
  }
  const entryChunk = facadesByEntryPath.get(entryFile)!;
  entryChunk.preModules = new Set(preModules);
  const chunksByAtom = new Map<ChunkAtom, Chunk>();
  for (const atom of plan.chunks) {
    const entryIndices = [...bitIndices(atom.dependentEntries)];
    let ownerChunk: Chunk;
    if (entryIndices.length === 1) {
      ownerChunk = facadesByEntryPath.get(plan.entryPoints[entryIndices[0]!]!.module.path)!;
    } else {
      const ownerPaths = entryIndices
        .map((index) =>
          toPosixPath(
            path.relative(
              options.serverRoot ?? options.projectRoot,
              plan.entryPoints[index]!.module.path
            )
          )
        )
        .sort();
      const hash = createHash('sha256')
        .update(JSON.stringify(ownerPaths))
        .digest('hex')
        .slice(0, 16);
      ownerChunk = new Chunk(`/__shared-${hash}.js`, new Set(), graph, options, strategy, true);
      chunks.add(ownerChunk);
    }
    ownerChunk.deps = new Set(atom.modules);
    chunksByAtom.set(atom, ownerChunk);
  }
  return { chunks, entryChunk, entryPathsByChunk, facadesByEntryPath, chunksByAtom };
}

function assignEntryChunkRequirements(
  plan: BitSetChunkPlan,
  { chunks, entryChunk, entryPathsByChunk, facadesByEntryPath, chunksByAtom }: PageChunks
): Map<string, readonly Chunk[]> {
  const requiredChunksByEntryPath = new Map<string, readonly Chunk[]>();
  for (const [entryPath, atoms] of plan.requiredChunksByEntryPath) {
    const facade = facadesByEntryPath.get(entryPath)!;
    const requiredChunks = new Set([facade, ...atoms.map((atom) => chunksByAtom.get(atom)!)]);
    requiredChunks.delete(entryChunk);
    if (facade !== entryChunk && facade.deps.size === 0) {
      chunks.delete(facade);
      entryPathsByChunk.delete(facade);
      requiredChunks.delete(facade);
      if (requiredChunks.size === 0) entryPathsByChunk.get(entryChunk)!.push(entryPath);
    }
    for (const ownerChunk of requiredChunks) {
      if (ownerChunk !== facade) facade.requiredChunks.add(ownerChunk);
    }
    requiredChunksByEntryPath.set(entryPath, [...requiredChunks]);
  }

  return requiredChunksByEntryPath;
}

function collectWorkerChunks(
  context: ChunkingContext,
  strategy: ChunkingImplementation,
  workerEntries: BitSetChunkPlan['workerEntries']
): { chunks: Set<Chunk>; chunksByEntryPath: Map<string, Chunk> } {
  const { preModules } = context;
  const workerChunksByEntryPath = new Map<string, Chunk>();
  // The eligibility scan excludes worker-local async imports before planning. Supported
  // workers keep their own runtime and copies of dependencies shared with the page.
  const workerChunks = new Set<Chunk>();
  const collectChunk = createChunkCollector(
    context,
    strategy,
    workerChunks,
    (dependency) => dependency.data.data.asyncType !== 'weak'
  );
  for (const module of workerEntries) {
    const chunk = collectChunk(module.path, preModules, true, true);
    assert(chunk, `Worker chunk not found for: ${module.path}`);
    chunk.seal();
  }
  for (const workerChunk of workerChunks) {
    assert(
      workerChunk.sealed,
      'Worker async edges must fall back to legacy before Granular planning.'
    );
    for (const module of workerChunk.entries) workerChunksByEntryPath.set(module.path, workerChunk);
  }
  return { chunks: workerChunks, chunksByEntryPath: workerChunksByEntryPath };
}

function assignModuleIds(
  chunks: Iterable<Chunk>,
  createModuleId: ChunkingContext['options']['createModuleId']
): void {
  // Allocate module IDs in sorted order, preserving any IDs already assigned.
  const modulePaths = new Set<string>();
  for (const chunk of chunks) {
    for (const module of [...chunk.preModules, ...chunk.deps]) {
      modulePaths.add(module.path);
      for (const dependency of module.dependencies.values()) {
        if (isResolvedDependency(dependency)) modulePaths.add(dependency.absolutePath);
      }
    }
  }
  for (const modulePath of [...modulePaths].sort()) createModuleId(modulePath);
}
