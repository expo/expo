import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';

import type { AsyncDependencyType } from '../../transform-worker/collect-dependencies';

/**
 * Plan application chunks in two bitset domains. Entry bits identify the initial or dynamic entries
 * that synchronously reach a module. Modules with identical entry sets form a raw atom.
 * Atom bits identify these raw groups within an entry's dependency or availability set.
 *
 * Reachability says who needs a module; normalized ownership says which entries must supply
 * it. An entry can stop owning an atom only when every importer path already supplies it.
 * Availability is a build-time guarantee about which modules are registered before an entry loads.
 */
export type BitSet = bigint;
type GraphModule = Module<MixedOutput>;

export function* bitIndices(bits: BitSet): IterableIterator<number> {
  if (bits < 0n) throw new Error('BitSet operations require a non-negative value.');
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
  readonly dynamicImportsByEntry: readonly BitSet[];
  readonly workerEntries: readonly GraphModule[];
}

/** Modules with the same entrypoint owners. */
export interface ChunkAtom {
  /**
   * Raw atoms start with all dependent entries as owners. Normalization removes entries
   * that inherit these modules from every importer path.
   */
  readonly ownerEntries: BitSet;
  readonly modules: ReadonlySet<GraphModule>;
}

export interface BitSetChunkPlan extends BitSetGraphAnalysis {
  readonly rawAtoms: readonly ChunkAtom[];
  /** Bits refer to rawAtoms, not entrypoints. */
  readonly staticDependencyAtomsByEntry: readonly BitSet[];
  readonly guaranteedLoadedAtomsByEntry: readonly BitSet[];
  readonly chunks: readonly ChunkAtom[];
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
    .map(([ownerEntries, modules]) => ({
      ownerEntries,
      modules: new Set(modules.sort(compareModules)),
    }));
}

export function computeBitSetChunkPlan(
  initialEntries: readonly GraphModule[],
  graph: ReadOnlyGraph,
  options: { isLazyBundle: boolean }
): BitSetChunkPlan {
  const analysis = analyzeBitSetGraph(initialEntries, graph, options);
  const { entryPoints, dependentEntriesByModule, dynamicImportsByEntry } = analysis;
  const rawAtoms = groupModulesByOwners(dependentEntriesByModule);
  const staticDependencyAtomsByEntry = getStaticDependencyAtomsByEntry(entryPoints, rawAtoms);
  const guaranteedLoadedAtomsByEntry = computeGuaranteedLoadedAtoms(
    entryPoints,
    dynamicImportsByEntry,
    staticDependencyAtomsByEntry,
    rawAtoms.length
  );
  const chunks = normalizeAtomOwners(rawAtoms, guaranteedLoadedAtomsByEntry);
  const requiredChunksByEntryPath = getRequiredChunksByEntryPath(
    entryPoints,
    chunks,
    dependentEntriesByModule
  );
  return {
    ...analysis,
    rawAtoms,
    staticDependencyAtomsByEntry,
    guaranteedLoadedAtomsByEntry,
    chunks,
    requiredChunksByEntryPath,
  };
}

/** Transpose atom owners into each entry's synchronous closure, including the entry itself. */
function getStaticDependencyAtomsByEntry(
  entryPoints: readonly PlannerEntryPoint[],
  rawAtoms: readonly ChunkAtom[]
): BitSet[] {
  const staticDependencyAtomsByEntry = entryPoints.map(() => 0n);
  for (const [atomIndex, atom] of rawAtoms.entries()) {
    const atomMask = 1n << BigInt(atomIndex);
    for (const entryIndex of bitIndices(atom.ownerEntries)) {
      staticDependencyAtomsByEntry[entryIndex] =
        staticDependencyAtomsByEntry[entryIndex]! | atomMask;
    }
  }

  return staticDependencyAtomsByEntry;
}

/** Find atoms guaranteed to be registered before each entry loads, across all importer paths. */
function computeGuaranteedLoadedAtoms(
  entryPoints: readonly PlannerEntryPoint[],
  dynamicImportsByEntry: readonly BitSet[],
  staticDependencyAtomsByEntry: readonly BitSet[],
  atomCount: number
): BitSet[] {
  const allAtoms = (1n << BigInt(atomCount)) - 1n;
  // Initial entries inherit nothing. Dynamic entries start with every atom as a candidate;
  // propagation from the initial roots removes candidates not supplied on every path.
  const guaranteedLoadedAtomsByEntry = entryPoints.map((entry) =>
    entry.kind === 'initial' ? 0n : allAtoms
  );
  const pendingEntries = new Set<number>();
  for (const [index, entry] of entryPoints.entries()) {
    if (entry.kind === 'initial') pendingEntries.add(index);
  }
  for (const entryIndex of pendingEntries) {
    pendingEntries.delete(entryIndex);
    const availableAtoms =
      staticDependencyAtomsByEntry[entryIndex]! | guaranteedLoadedAtomsByEntry[entryIndex]!;
    for (const targetIndex of bitIndices(dynamicImportsByEntry[entryIndex]!)) {
      // An importer supplies its own closure plus what it inherited. Intersecting each
      // importer can only remove bits, so re-queuing changed targets also converges in cycles.
      const updatedLoadedAtoms = guaranteedLoadedAtomsByEntry[targetIndex]! & availableAtoms;
      if (updatedLoadedAtoms === guaranteedLoadedAtomsByEntry[targetIndex]) continue;
      guaranteedLoadedAtomsByEntry[targetIndex] = updatedLoadedAtoms;
      pendingEntries.add(targetIndex);
    }
  }

  return guaranteedLoadedAtomsByEntry;
}

/**
 * Remove owners that always inherit an atom, then merge groups whose remaining owners match.
 * For main => a => b, with a -> shared and b -> shared, only a needs to own shared.
 * Adding main => b prevents that removal: b can now load without a supplying shared.
 * Here => is a dynamic import and -> is a synchronous dependency.
 */
function normalizeAtomOwners(
  rawAtoms: readonly ChunkAtom[],
  guaranteedLoadedAtomsByEntry: readonly BitSet[]
): ChunkAtom[] {
  const normalizedOwnersByModule = new Map<GraphModule, BitSet>();
  for (const [atomIndex, atom] of rawAtoms.entries()) {
    let owners = atom.ownerEntries;
    for (const entryIndex of bitIndices(owners)) {
      if ((guaranteedLoadedAtomsByEntry[entryIndex]! & (1n << BigInt(atomIndex))) !== 0n) {
        owners &= ~(1n << BigInt(entryIndex));
      }
    }
    // On a path from an initial entry, the first owner cannot inherit this atom from the
    // preceding non-owners. Its bit must survive; losing every owner is an analysis bug.
    if (owners === 0n) {
      throw new Error(
        `BitSet atom containing ${[...atom.modules][0]!.path} lost every owner. ` +
          'Check initial-root reachability and complete dynamic importer tracking.'
      );
    }
    for (const module of atom.modules) normalizedOwnersByModule.set(module, owners);
  }

  return groupModulesByOwners(normalizedOwnersByModule);
}

/** Keep complete entry requirements even when normalization moves ownership to an importer. */
function getRequiredChunksByEntryPath(
  entryPoints: readonly PlannerEntryPoint[],
  chunks: readonly ChunkAtom[],
  dependentEntriesByModule: ReadonlyMap<GraphModule, BitSet>
): Map<string, readonly ChunkAtom[]> {
  const requiredChunksByEntry = entryPoints.map(() => [] as ChunkAtom[]);
  for (const chunk of chunks) {
    let requiredBy = 0n;
    for (const module of chunk.modules) {
      requiredBy |= dependentEntriesByModule.get(module)!;
    }
    for (const entryIndex of bitIndices(requiredBy)) {
      requiredChunksByEntry[entryIndex]!.push(chunk);
    }
  }
  return new Map(
    entryPoints.map((entry, index) => [entry.module.path, requiredChunksByEntry[index]!])
  );
}

function compareModules(a: GraphModule, b: GraphModule): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
}

/** Analyze a complete application graph, excluding worker dependencies. */
export function analyzeBitSetGraph(
  initialEntries: readonly GraphModule[],
  graph: ReadOnlyGraph,
  options: { isLazyBundle: boolean }
): BitSetGraphAnalysis {
  const { entryPoints, edgesByModule, workerEntries } = discoverEntryGraph(
    initialEntries,
    graph,
    options
  );
  return {
    entryPoints,
    ...computeEntryReachability(entryPoints, edgesByModule),
    workerEntries,
  };
}

type ModuleEdge = { target: GraphModule; isDynamic: boolean };

type DiscoveredEntryGraph = {
  entryPoints: readonly PlannerEntryPoint[];
  edgesByModule: ReadonlyMap<GraphModule, readonly ModuleEdge[]>;
  workerEntries: readonly GraphModule[];
};

/** Discover from initial roots so disconnected dynamic cycles never enter availability analysis. */
function discoverEntryGraph(
  initialEntries: readonly GraphModule[],
  graph: ReadOnlyGraph,
  { isLazyBundle }: { isLazyBundle: boolean }
): DiscoveredEntryGraph {
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

  const edgesByModule = new Map<GraphModule, ModuleEdge[]>();
  const workerEntries = new Set<GraphModule>();
  const pendingModules = [...entriesByPath.values()].map((entry) => entry.module);
  for (let index = 0; index < pendingModules.length; index++) {
    const module = pendingModules[index]!;
    if (edgesByModule.has(module)) continue;
    const moduleEdges: ModuleEdge[] = [];
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
  return {
    entryPoints,
    edgesByModule,
    workerEntries: [...workerEntries].sort(compareModules),
  };
}

/** Follow synchronous edges per entry; record dynamic targets without absorbing their closures. */
function computeEntryReachability(
  entryPoints: readonly PlannerEntryPoint[],
  edgesByModule: ReadonlyMap<GraphModule, readonly ModuleEdge[]>
): Pick<BitSetGraphAnalysis, 'dependentEntriesByModule' | 'dynamicImportsByEntry'> {
  const entryIndexByPath = new Map(entryPoints.map((entry, index) => [entry.module.path, index]));
  const dependentEntriesByModule = new Map<GraphModule, BitSet>();
  const dynamicImportsByEntry = entryPoints.map(() => 0n);
  for (const [entryIndex, entry] of entryPoints.entries()) {
    const pendingDependencies = [entry.module];
    const entryMask = 1n << BigInt(entryIndex);
    for (let index = 0; index < pendingDependencies.length; index++) {
      const module = pendingDependencies[index]!;
      const owners = dependentEntriesByModule.get(module) ?? 0n;
      if ((owners & entryMask) !== 0n) continue;
      dependentEntriesByModule.set(module, owners | entryMask);
      for (const edge of edgesByModule.get(module)!) {
        if (!edge.isDynamic) {
          pendingDependencies.push(edge.target);
        } else {
          const targetIndex = entryIndexByPath.get(edge.target.path)!;
          if (entryPoints[targetIndex]!.kind !== 'initial') {
            dynamicImportsByEntry[entryIndex] =
              dynamicImportsByEntry[entryIndex]! | (1n << BigInt(targetIndex));
          }
        }
      }
    }
  }

  return {
    dependentEntriesByModule: new Map(
      [...dependentEntriesByModule].sort(([a], [b]) => compareModules(a, b))
    ),
    dynamicImportsByEntry,
  };
}
