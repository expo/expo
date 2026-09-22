import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';

import type { AsyncDependencyType } from '../../transform-worker/collect-dependencies';

export type BitSet = bigint;
type GraphModule = Module<MixedOutput>;

function validateBits(bits: BitSet): void {
  if (bits < 0n) throw new Error('BitSet operations require a non-negative value.');
}

function validateIndex(index: number): void {
  if (!Number.isSafeInteger(index) || index < 0) {
    throw new Error('BitSet indices and counts must be a non-negative safe integer.');
  }
}

export function addBit(bits: BitSet, index: number): BitSet {
  validateBits(bits);
  validateIndex(index);
  return bits | (1n << BigInt(index));
}

export function removeBit(bits: BitSet, index: number): BitSet {
  validateBits(bits);
  validateIndex(index);
  return bits & ~(1n << BigInt(index));
}

export function hasBit(bits: BitSet, index: number): boolean {
  validateBits(bits);
  validateIndex(index);
  return (bits & (1n << BigInt(index))) !== 0n;
}

export function allBits(count: number): BitSet {
  validateIndex(count);
  return (1n << BigInt(count)) - 1n;
}

export function* bitIndices(bits: BitSet): IterableIterator<number> {
  validateBits(bits);
  for (let index = 0; bits !== 0n; index++, bits >>= 1n) {
    if ((bits & 1n) !== 0n) yield index;
  }
}

export interface PlannerEntryPoint {
  readonly module: GraphModule;
  readonly kind: 'initial' | 'dynamic';
}

export interface BitSetGraphAnalysis {
  readonly entryPoints: readonly PlannerEntryPoint[];
  readonly dependentEntriesByModule: ReadonlyMap<GraphModule, BitSet>;
  readonly importerEntriesByDynamicEntry: readonly BitSet[];
  readonly dynamicImportsByEntry: readonly BitSet[];
  readonly workerEntries: readonly GraphModule[];
}

/** Modules with the same entrypoint owners. */
export interface ChunkAtom {
  readonly dependentEntries: BitSet;
  readonly modules: ReadonlySet<GraphModule>;
}

export interface BitSetChunkPlan extends BitSetGraphAnalysis {
  readonly rawAtoms: readonly ChunkAtom[];
  /** Bits refer to rawAtoms, not entrypoints. */
  readonly staticAtoms: readonly BitSet[];
  readonly alreadyLoadedAtoms: readonly BitSet[];
  readonly chunks: readonly ChunkAtom[];
  readonly chunkByModule: ReadonlyMap<GraphModule, ChunkAtom>;
  /** All chunks needed by each entry, including ones already loaded. */
  readonly requiredChunksByEntryPath: ReadonlyMap<string, readonly ChunkAtom[]>;
}

function groupModulesByOwners(ownersByModule: ReadonlyMap<GraphModule, BitSet>): ChunkAtom[] {
  const modulesByOwners = new Map<BitSet, GraphModule[]>();
  for (const [module, bits] of ownersByModule) {
    let modules = modulesByOwners.get(bits);
    if (!modules) {
      modules = [];
      modulesByOwners.set(bits, modules);
    }
    modules.push(module);
  }
  return [...modulesByOwners]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dependentEntries, modules]) => ({
      dependentEntries,
      modules: new Set(modules.sort(compareModules)),
    }));
}

export function computeBitSetChunkPlan(
  initialEntries: readonly GraphModule[],
  graph: ReadOnlyGraph,
  options: { isLazyBundle: boolean }
): BitSetChunkPlan {
  const analysis = analyzeBitSetGraph(initialEntries, graph, options);
  const {
    entryPoints,
    dependentEntriesByModule,
    importerEntriesByDynamicEntry,
    dynamicImportsByEntry,
  } = analysis;
  const rawAtoms = groupModulesByOwners(dependentEntriesByModule);
  const staticAtoms = entryPoints.map(() => 0n);
  for (const [atomIndex, atom] of rawAtoms.entries()) {
    const atomMask = 1n << BigInt(atomIndex);
    for (const entryIndex of bitIndices(atom.dependentEntries)) {
      staticAtoms[entryIndex] = staticAtoms[entryIndex]! | atomMask;
    }
  }

  const allAtoms = allBits(rawAtoms.length);
  const alreadyLoadedAtoms = entryPoints.map((entry) => (entry.kind === 'initial' ? 0n : allAtoms));
  const pendingEntries = new Set<number>();
  for (const [index, entry] of entryPoints.entries()) {
    if (entry.kind === 'initial') continue;
    if (importerEntriesByDynamicEntry[index] === 0n) {
      throw new Error(
        `BitSet dynamic entry ${entry.module.path} has no importer. Check root-based entry discovery.`
      );
    }
    pendingEntries.add(index);
  }
  for (const entryIndex of pendingEntries) {
    // Allow re-queuing when an importer's availability changes.
    pendingEntries.delete(entryIndex);
    let updatedLoadedAtoms = allAtoms;
    for (const importerIndex of bitIndices(importerEntriesByDynamicEntry[entryIndex]!)) {
      updatedLoadedAtoms &= staticAtoms[importerIndex]! | alreadyLoadedAtoms[importerIndex]!;
    }
    if (updatedLoadedAtoms === alreadyLoadedAtoms[entryIndex]) continue;
    alreadyLoadedAtoms[entryIndex] = updatedLoadedAtoms;
    for (const descendantIndex of bitIndices(dynamicImportsByEntry[entryIndex]!))
      pendingEntries.add(descendantIndex);
  }

  const normalizedOwnersByModule = new Map<GraphModule, BitSet>();
  const rawOwnersByNormalizedOwners = new Map<BitSet, BitSet>();
  for (const [atomIndex, atom] of rawAtoms.entries()) {
    let owners = atom.dependentEntries;
    for (const entryIndex of bitIndices(owners)) {
      if (hasBit(alreadyLoadedAtoms[entryIndex]!, atomIndex))
        owners = removeBit(owners, entryIndex);
    }
    // The first owner on a path from an initial entry cannot already have this atom loaded.
    if (owners === 0n) {
      throw new Error(
        `BitSet atom containing ${[...atom.modules][0]!.path} lost every owner. ` +
          'Check initial-root reachability and complete dynamic importer tracking.'
      );
    }
    for (const module of atom.modules) normalizedOwnersByModule.set(module, owners);
    rawOwnersByNormalizedOwners.set(
      owners,
      (rawOwnersByNormalizedOwners.get(owners) ?? 0n) | atom.dependentEntries
    );
  }

  const chunks = groupModulesByOwners(normalizedOwnersByModule);
  const chunkByModule = new Map<GraphModule, ChunkAtom>();
  const requiredChunksByEntry = entryPoints.map(() => [] as ChunkAtom[]);
  for (const chunk of chunks) {
    for (const module of chunk.modules) {
      chunkByModule.set(module, chunk);
    }
    for (const entryIndex of bitIndices(rawOwnersByNormalizedOwners.get(chunk.dependentEntries)!)) {
      requiredChunksByEntry[entryIndex]!.push(chunk);
    }
  }
  return {
    ...analysis,
    rawAtoms,
    staticAtoms,
    alreadyLoadedAtoms,
    chunks,
    chunkByModule,
    requiredChunksByEntryPath: new Map(
      entryPoints.map((entry, index) => [entry.module.path, requiredChunksByEntry[index]!])
    ),
  };
}

function compareModules(a: GraphModule, b: GraphModule): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
}

/** Analyze a complete page graph, excluding worker dependencies. */
export function analyzeBitSetGraph(
  initialEntries: readonly GraphModule[],
  graph: ReadOnlyGraph,
  { isLazyBundle }: { isLazyBundle: boolean }
): BitSetGraphAnalysis {
  if (isLazyBundle) {
    throw new Error(
      'BitSet chunking requires a complete non-lazy export graph. Disable lazy bundling.'
    );
  }
  if (initialEntries.length === 0) {
    throw new Error('BitSet chunking requires an initial entry. Pass the export entry module.');
  }

  const entriesByPath = new Map<string, PlannerEntryPoint>();
  for (const entry of initialEntries) {
    const module = graph.dependencies.get(entry.path);
    if (!module) {
      throw new Error(
        `BitSet initial entry ${entry.path} is missing. Supply a complete export graph.`
      );
    }
    entriesByPath.set(module.path, { module, kind: 'initial' });
  }

  const edgesByModule = new Map<GraphModule, { target: GraphModule; isDynamic: boolean }[]>();
  const workerEntries = new Set<GraphModule>();
  const pendingModules = [...entriesByPath.values()].map((entry) => entry.module);
  for (let index = 0; index < pendingModules.length; index++) {
    const module = pendingModules[index]!;
    if (edgesByModule.has(module)) continue;
    const moduleEdges: { target: GraphModule; isDynamic: boolean }[] = [];
    edgesByModule.set(module, moduleEdges);
    for (const dependency of module.dependencies.values()) {
      const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
      if (!isResolvedDependency(dependency) || asyncType === 'weak') continue;
      const target = graph.dependencies.get(dependency.absolutePath);
      if (!target) {
        throw new Error(
          `BitSet dependency from ${module.path} to ${dependency.absolutePath} is missing. ` +
            'Production chunking requires a complete export graph; check graph transforms and disable lazy bundling.'
        );
      }
      if (asyncType === 'worker') {
        workerEntries.add(target);
        continue;
      }
      const isDynamic = asyncType != null;
      if (isDynamic && !entriesByPath.has(target.path)) {
        entriesByPath.set(target.path, { module: target, kind: 'dynamic' });
      }
      moduleEdges.push({ target, isDynamic });
      pendingModules.push(target);
    }
  }

  const entryPoints = [...entriesByPath.values()].sort((a, b) =>
    compareModules(a.module, b.module)
  );
  const entryIndexByPath = new Map(entryPoints.map((entry, index) => [entry.module.path, index]));
  const dependentEntriesByModule = new Map<GraphModule, BitSet>();
  for (const [entryIndex, entry] of entryPoints.entries()) {
    const pendingDependencies = [entry.module];
    const entryMask = 1n << BigInt(entryIndex);
    for (let index = 0; index < pendingDependencies.length; index++) {
      const module = pendingDependencies[index]!;
      const owners = dependentEntriesByModule.get(module) ?? 0n;
      if ((owners & entryMask) !== 0n) continue;
      dependentEntriesByModule.set(module, owners | entryMask);
      for (const edge of edgesByModule.get(module)!) {
        if (!edge.isDynamic) pendingDependencies.push(edge.target);
      }
    }
  }

  const importerEntriesByDynamicEntry = entryPoints.map(() => 0n);
  const dynamicImportsByEntry = entryPoints.map(() => 0n);
  for (const [module, moduleEdges] of edgesByModule) {
    const importerBits = dependentEntriesByModule.get(module)!;
    for (const edge of moduleEdges) {
      if (!edge.isDynamic) continue;
      const targetIndex = entryIndexByPath.get(edge.target.path)!;
      if (entryPoints[targetIndex]!.kind === 'initial') continue;
      importerEntriesByDynamicEntry[targetIndex] =
        importerEntriesByDynamicEntry[targetIndex]! | importerBits;
      for (const importerIndex of bitIndices(importerBits)) {
        dynamicImportsByEntry[importerIndex] = addBit(
          dynamicImportsByEntry[importerIndex]!,
          targetIndex
        );
      }
    }
  }

  return {
    entryPoints,
    dependentEntriesByModule: new Map(
      [...dependentEntriesByModule].sort(([a], [b]) => compareModules(a, b))
    ),
    importerEntriesByDynamicEntry,
    dynamicImportsByEntry,
    workerEntries: [...workerEntries].sort(compareModules),
  };
}
