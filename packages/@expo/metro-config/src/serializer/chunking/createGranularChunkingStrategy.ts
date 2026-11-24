import type { MixedOutput, Module, ResolvedDependency } from '@expo/metro/metro/DeltaBundler/types';
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
  let application: RegistryChunks | undefined;
  const registriesByChunk = new Map<Chunk, RegistryChunks>();
  const workerChunksByEntryPath = new Map<string, Chunk>();

  function getChunkTargets(chunk: Chunk, dependency: ResolvedDependency): readonly Chunk[] {
    const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
    if (asyncType == null || asyncType === 'weak') return [];
    if (asyncType === 'worker') {
      const workerChunk = workerChunksByEntryPath.get(dependency.absolutePath);
      assert(workerChunk, `Worker chunk not found for: ${dependency.absolutePath}`);
      return [workerChunk];
    }
    const targets = registriesByChunk
      .get(chunk)
      ?.requiredChunksByEntryPath.get(dependency.absolutePath);
    assert(targets, `Granular async entry not found: ${dependency.absolutePath}`);
    // The importing chunk is already loaded. Return the other chunks needed by
    // the imported entry; the loader skips files it has already loaded.
    return targets.filter((target) => target !== chunk);
  }

  const strategy: ChunkingImplementation = {
    async serializeAsync() {
      const entryModule = graph.dependencies.get(entryFile);
      assert(entryModule, `Granular entry is missing from the export graph: ${entryFile}`);
      application = planRegistryChunks(context, strategy, entryModule, false);
      const { entryChunk } = application;
      // Application chunks share one module registry. Extract its runtime so it can load
      // before dependent chunks; worker entries carry independent runtimes.
      if ([...application.chunks].some((chunk) => chunk.isAsync)) {
        createRuntimeChunk(entryChunk, application.chunks, strategy);
      }
      // Each worker has its own module registry, so it cannot use the chunks planned for the
      // application or for another worker. Plan the chunks of each worker from its entry.
      const registries = [application];
      const workerEntries = [...application.workerEntries];
      for (const workerEntry of workerEntries) {
        if (workerChunksByEntryPath.has(workerEntry.path)) continue;
        const worker = planRegistryChunks(context, strategy, workerEntry, true);
        workerChunksByEntryPath.set(workerEntry.path, worker.entryChunk);
        registries.push(worker);
        workerEntries.push(...worker.workerEntries);
      }
      const chunks = new Set<Chunk>();
      for (const registry of registries) {
        for (const chunk of registry.chunks) {
          chunks.add(chunk);
          registriesByChunk.set(chunk, registry);
        }
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
        // Only the application loader reads chunk completions.
        includeChunkCompletion: chunk.isAsync && registriesByChunk.get(chunk) === application,
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
              [...application!.requiredChunksByEntryPath].map(([entryPath, requiredChunks]) => [
                entryPath,
                requiredChunks.map((requiredChunk) => {
                  const filename = filenamesByChunk.get(requiredChunk);
                  assert(filename, `Required chunk was not emitted: ${requiredChunk.name}`);
                  return filename;
                }),
              ])
            ),
          }),
        entryPaths: [...(application!.entryPathsByChunk.get(chunk) ?? [])].sort(),
        modulePaths: chunk.sealed ? modulePaths : modulePaths.sort(),
      };
    },
  };
  return strategy;
}

type MaterializedChunkPlan = {
  chunks: Set<Chunk>;
  entryChunk: Chunk;
  entryPathsByChunk: Map<Chunk, string[]>;
  facadesByEntryPath: Map<string, Chunk>;
  chunksByAtom: Map<ChunkAtom, Chunk>;
};

/**
 * Create a chunk for each group of modules with the same owners, and track which entries
 * each chunk represents.
 */
function materializeChunkPlan(
  { preModules, graph, options }: ChunkingContext,
  strategy: ChunkingImplementation,
  plan: BitSetChunkPlan,
  entryFile: string,
  isWorker: boolean
): MaterializedChunkPlan {
  const getRelativePath = (modulePath: string) =>
    toPosixPath(path.relative(options.serverRoot ?? options.projectRoot, modulePath));
  const getChunkName = (prefix: string, paths: string[]) =>
    `/${prefix}-${createHash('sha256').update(JSON.stringify(paths)).digest('hex').slice(0, 16)}.js`;
  // The application and each worker can have a chunk for the same module, with different
  // contents. The worker entry in the name gives each chunk of a worker its own filename.
  const getWorkerChunkName = (ownerPaths: string[]) =>
    getChunkName('__worker', [getRelativePath(entryFile), ...ownerPaths]);
  const chunks = new Set<Chunk>();
  const entryPathsByChunk = new Map<Chunk, string[]>();
  const facadesByEntryPath = new Map<string, Chunk>();
  for (const { module, kind } of plan.entryPoints) {
    const isInitial = kind === 'initial';
    const facade = new Chunk(
      isWorker && !isInitial ? getWorkerChunkName([getRelativePath(module.path)]) : module.path,
      new Set([module]),
      graph,
      options,
      strategy,
      isWorker || !isInitial,
      false,
      isInitial
    );
    // A worker entry carries the runtime of its own module registry.
    if (isWorker && isInitial) facade.seal();
    facade.deps.clear();
    entryPathsByChunk.set(facade, [module.path]);
    facadesByEntryPath.set(module.path, facade);
    chunks.add(facade);
  }
  const entryChunk = facadesByEntryPath.get(entryFile)!;
  entryChunk.preModules = new Set(preModules);
  const chunksByAtom = new Map<ChunkAtom, Chunk>();
  for (const atom of plan.chunks) {
    const entryIndices = [...bitIndices(atom.ownerEntries)];
    let ownerChunk: Chunk;
    if (entryIndices.length === 1) {
      ownerChunk = facadesByEntryPath.get(plan.entryPoints[entryIndices[0]!]!.module.path)!;
    } else {
      // Owner paths remain stable when unrelated entries shift the planner's bit positions.
      const ownerPaths = entryIndices
        .map((index) => getRelativePath(plan.entryPoints[index]!.module.path))
        .sort();
      ownerChunk = new Chunk(
        isWorker ? getWorkerChunkName(ownerPaths) : getChunkName('__shared', ownerPaths),
        new Set(),
        graph,
        options,
        strategy,
        true
      );
      chunks.add(ownerChunk);
    }
    ownerChunk.deps = new Set(atom.modules);
    chunksByAtom.set(atom, ownerChunk);
  }
  return { chunks, entryChunk, entryPathsByChunk, facadesByEntryPath, chunksByAtom };
}

/**
 * Map each entry to its required files. If its modules are all in other chunks,
 * remove its empty entry chunk but keep that mapping.
 * The returned map includes the entry's own file when emitted, and excludes the initial chunk.
 */
function assignEntryChunkRequirements(
  plan: BitSetChunkPlan,
  { chunks, entryChunk, entryPathsByChunk, facadesByEntryPath, chunksByAtom }: MaterializedChunkPlan
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
      // An entry supplied entirely by the initial bundle has no additional files to request.
      if (requiredChunks.size === 0) entryPathsByChunk.get(entryChunk)!.push(entryPath);
    }
    // Asset ordering needs the dependencies before the entry's file, excluding the file itself.
    for (const ownerChunk of requiredChunks) {
      if (ownerChunk !== facade) facade.requiredChunks.add(ownerChunk);
    }
    requiredChunksByEntryPath.set(entryPath, [...requiredChunks]);
  }

  return requiredChunksByEntryPath;
}

/** The chunks that register modules in one module registry: the application's or a worker's. */
type RegistryChunks = {
  chunks: Set<Chunk>;
  entryChunk: Chunk;
  entryPathsByChunk: Map<Chunk, string[]>;
  requiredChunksByEntryPath: Map<string, readonly Chunk[]>;
  workerEntries: readonly Module<MixedOutput>[];
};

function planRegistryChunks(
  context: ChunkingContext,
  strategy: ChunkingImplementation,
  entryModule: Module<MixedOutput>,
  isWorker: boolean
): RegistryChunks {
  const plan = computeBitSetChunkPlan([entryModule], context.graph, {
    isLazyBundle: context.options.includeAsyncPaths,
  });
  const materializedPlan = materializeChunkPlan(
    context,
    strategy,
    plan,
    entryModule.path,
    isWorker
  );
  return {
    chunks: materializedPlan.chunks,
    entryChunk: materializedPlan.entryChunk,
    entryPathsByChunk: materializedPlan.entryPathsByChunk,
    requiredChunksByEntryPath: assignEntryChunkRequirements(plan, materializedPlan),
    workerEntries: plan.workerEntries,
  };
}

function assignModuleIds(
  chunks: Iterable<Chunk>,
  createModuleId: ChunkingContext['options']['createModuleId']
): void {
  // Assign module IDs before serialization so chunk order does not determine them.
  // Keep previously assigned module IDs.
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
