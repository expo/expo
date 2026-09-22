import { microBundle } from '../../fork/__tests__/mini-metro';
import {
  addBit,
  allBits,
  analyzeBitSetGraph,
  bitIndices,
  computeBitSetChunkPlan,
  hasBit,
  removeBit,
} from '../computeBitSetChunks';

async function loadGraph(fs: Record<string, string>, legacyTraverseWeakDependencies = false) {
  const [entryPath, , graph] = await microBundle({
    fs,
    options: { platform: 'web', dev: false, splitChunks: true, legacyTraverseWeakDependencies },
  });
  return { graph, entry: graph.dependencies.get(entryPath)! };
}

describe('BigInt bitsets', () => {
  it.each([
    [0n, 2, 0b100n],
    [0b010n, 2, 0b110n],
    [0b100n, 2, 0b100n],
    [0n, 70, 0x400000000000000000n],
  ] as const)('adds bit %s / %s', (bits, index, expected) => {
    expect(addBit(bits, index)).toBe(expected);
  });

  it.each([
    [0b110n, 2, 0b010n],
    [0b110n, 3, 0b110n],
    [0b100n, 2, 0n],
    [0x400000000000000001n, 70, 1n],
  ] as const)('removes bit %s / %s', (bits, index, expected) => {
    expect(removeBit(bits, index)).toBe(expected);
  });

  it.each([
    [0n, 0, false],
    [0b100n, 2, true],
    [0b100n, 1, false],
    [0x400000000000000000n, 70, true],
  ] as const)('tests bit %s / %s', (bits, index, expected) => {
    expect(hasBit(bits, index)).toBe(expected);
  });

  it.each([
    [0, 0n],
    [1, 1n],
    [5, 0b11111n],
    [31, 0x7fffffffn],
    [32, 0xffffffffn],
    [33, 0x1ffffffffn],
    [63, 0x7fffffffffffffffn],
    [64, 0xffffffffffffffffn],
    [65, 0x1ffffffffffffffffn],
    [127, 0x7fffffffffffffffffffffffffffffffn],
    [128, 0xffffffffffffffffffffffffffffffffn],
    [129, 0x1ffffffffffffffffffffffffffffffffn],
  ] as const)('creates a bounded mask for %s bits', (count, expected) => {
    expect(allBits(count)).toBe(expected);
  });

  it('iterates only set bits, including high sparse bits', () => {
    expect([...bitIndices(0n)]).toEqual([]);
    expect([...bitIndices(0x400000000000000005n)]).toEqual([0, 2, 70]);
  });

  it.each([-1, 0.5, NaN, Infinity])('rejects invalid indices and counts: %s', (index) => {
    expect(() => addBit(0n, index)).toThrow(/non-negative safe integer/);
    expect(() => removeBit(0n, index)).toThrow(/non-negative safe integer/);
    expect(() => hasBit(0n, index)).toThrow(/non-negative safe integer/);
    expect(() => allBits(index)).toThrow(/non-negative safe integer/);
  });

  it('rejects negative bitsets instead of looping forever', () => {
    expect(() => [...bitIndices(-1n)]).toThrow(/non-negative/);
    expect(() => addBit(-1n, 0)).toThrow(/non-negative/);
    expect(() => removeBit(-1n, 0)).toThrow(/non-negative/);
    expect(() => hasBit(-1n, 0)).toThrow(/non-negative/);
  });
});

describe('atoms and already-loaded ownership', () => {
  function owners(plan: ReturnType<typeof computeBitSetChunkPlan>, path: string) {
    const module = [...plan.chunkByModule.keys()].find(
      (module) => module.path === `/app/${path}.js`
    )!;
    return [...bitIndices(plan.chunkByModule.get(module)!.dependentEntries)].map(
      (index) => plan.entryPoints[index]!.module.path
    );
  }

  it.each([false, true])(
    'intersects independent initial entries (reverse roots: %s)',
    async (reverse) => {
      // Reduced Rollup improved-dynamic-chunks/multi-entry-different-and-shared-dependencies.
      const { graph } = await loadGraph({
        'index.js': `import './left'; import './right';`,
        'left.js': `import './shared'; import('./dynamic');`,
        'right.js': `import('./dynamic');`,
        'dynamic.js': `import './shared';`,
        'shared.js': '',
      });
      const roots = [
        graph.dependencies.get('/app/left.js')!,
        graph.dependencies.get('/app/right.js')!,
      ];
      const plan = computeBitSetChunkPlan(reverse ? roots.reverse() : roots, graph, {
        isLazyBundle: false,
      });
      expect(plan.entryPoints.map((e) => [e.module.path, e.kind])).toEqual([
        ['/app/dynamic.js', 'dynamic'],
        ['/app/left.js', 'initial'],
        ['/app/right.js', 'initial'],
      ]);
      expect(plan.importerEntriesByDynamicEntry).toEqual([0b110n, 0n, 0n]);
      expect(owners(plan, 'shared')).toEqual(['/app/dynamic.js', '/app/left.js']);
      expect(plan.chunkByModule.has(graph.dependencies.get('/app/index.js')!)).toBe(false);
    }
  );

  it('retains a weak target reached statically without assigning a dynamic entry', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `require.resolveWeak('./shared'); import('./a');`,
      'a.js': `import './shared';`,
      'shared.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(plan.entryPoints.map((e) => e.module.path)).toEqual(['/app/a.js', '/app/index.js']);
    expect(owners(plan, 'shared')).toEqual(['/app/a.js']);
  });

  it('transposes raw atoms, removes a nested owner, and regroups converged atoms', async () => {
    // Rollup improved-dynamic-chunks/dynamic-import-dynamic; Rolldown dynamic_dominator_chain.
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a');`,
      'a.js': `import './shared'; import('./b');`,
      'b.js': `import './shared';`,
      'shared.js': `import './shared-leaf';`,
      'shared-leaf.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(
      plan.rawAtoms.map((atom) => [atom.dependentEntries, [...atom.modules].map((m) => m.path)])
    ).toEqual([
      [0b001n, ['/app/a.js']],
      [0b010n, ['/app/b.js']],
      [0b011n, ['/app/shared-leaf.js', '/app/shared.js']],
      [0b100n, ['/app/index.js']],
      [0b101n, ['/app/expo-mock/async-require']],
    ]);
    expect(plan.staticAtoms).toEqual([0b10101n, 0b00110n, 0b11000n]);
    expect(plan.alreadyLoadedAtoms).toEqual([0b11000n, 0b11101n, 0n]);
    expect(
      plan.chunks.map((chunk) => [chunk.dependentEntries, [...chunk.modules].map((m) => m.path)])
    ).toEqual([
      [0b001n, ['/app/a.js', '/app/shared-leaf.js', '/app/shared.js']],
      [0b010n, ['/app/b.js']],
      [0b100n, ['/app/expo-mock/async-require', '/app/index.js']],
    ]);
    // Canonical requirements use original reachability, not the reduced owner bits.
    expect(
      plan.requiredChunksByEntryPath.get('/app/b.js')!.map((chunk) => chunk.dependentEntries)
    ).toEqual([1n, 2n]);
  });

  it.each([
    [false, ['/app/a.js']],
    [true, ['/app/a.js', '/app/b.js']],
  ] as const)(
    'intersects every loading context (independent b: %s)',
    async (independent, expected) => {
      const { entry, graph } = await loadGraph({
        'index.js': `import('./a'); ${independent ? "import('./b');" : ''}`,
        'a.js': `import './shared'; import('./b');`,
        'b.js': `import './shared';`,
        'shared.js': '',
      });
      expect(
        owners(computeBitSetChunkPlan([entry], graph, { isLazyBundle: false }), 'shared')
      ).toEqual(expected);
    }
  );

  it('propagates availability through a non-owner and preserves the first owner', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a');`,
      'a.js': `import './shared'; import('./b');`,
      'b.js': `import('./c');`,
      'c.js': `import './shared';`,
      'shared.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    const atomIndex = plan.rawAtoms.findIndex((atom) =>
      [...atom.modules].some((m) => m.path === '/app/shared.js')
    );
    expect(plan.rawAtoms[atomIndex]!.dependentEntries).toBe(0b0101n);
    expect(plan.alreadyLoadedAtoms.map((bits) => hasBit(bits, atomIndex))).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(owners(plan, 'shared')).toEqual(['/app/a.js']);
  });

  it('keeps AB, BC, and ABC sharing separate', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a'); import('./b'); import('./c');`,
      'a.js': `import './ab'; import './abc';`,
      'b.js': `import './ab'; import './bc'; import './abc';`,
      'c.js': `import './bc'; import './abc';`,
      'ab.js': '',
      'bc.js': '',
      'abc.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(owners(plan, 'ab')).toEqual(['/app/a.js', '/app/b.js']);
    expect(owners(plan, 'bc')).toEqual(['/app/b.js', '/app/c.js']);
    expect(owners(plan, 'abc')).toEqual(['/app/a.js', '/app/b.js', '/app/c.js']);
    expect(plan.chunks).toHaveLength(7);
  });

  it('does not assume a prefetched sibling is already loaded', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `__prefetchImport('./a'); import('./b');`,
      'a.js': `import './shared'; import('./c');`,
      'b.js': `import('./c');`,
      'c.js': `import './shared';`,
      'shared.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(plan.importerEntriesByDynamicEntry).toEqual([8n, 8n, 3n, 0n]);
    expect(owners(plan, 'shared')).toEqual(['/app/a.js', '/app/c.js']);
  });

  it.each([false, true])(
    'converges with a dynamic cycle (reverse graph order: %s)',
    async (reverse) => {
      // Rollup improved-dynamic-chunks/circular-dynamic-imports.
      const { entry, graph } = await loadGraph({
        'index.js': `import('./c');`,
        'c.js': `import './shared'; import('./b');`,
        'b.js': `import('./a');`,
        'a.js': `import './shared'; import('./c');`,
        'shared.js': '',
      });
      const dependencies = new Map(
        reverse ? [...graph.dependencies].reverse() : graph.dependencies
      );
      const plan = computeBitSetChunkPlan(
        [entry],
        { ...graph, dependencies },
        { isLazyBundle: false }
      );
      expect(owners(plan, 'shared')).toEqual(['/app/c.js']);
      expect(plan.chunks.map((chunk) => chunk.dependentEntries)).toEqual([1n, 2n, 4n, 8n]);
    }
  );

  it('excludes a disconnected dynamic cycle even though both nodes have importers', async () => {
    // Include the disconnected cycle so discovery has to exclude it.
    const { entry, graph } = await loadGraph(
      {
        'index.js': `require.resolveWeak('./a');`,
        'a.js': `import('./b');`,
        'b.js': `import('./a');`,
      },
      true
    );
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(plan.entryPoints.map((e) => e.module.path)).toEqual(['/app/index.js']);
    expect([...plan.chunkByModule.keys()].map((m) => m.path)).toEqual(['/app/index.js']);
  });

  it('keeps initial-owned dynamic aliases in the initial physical chunk', async () => {
    // Rollup improved-dynamic-chunks/dynamic-import-already-contained-1.
    const { entry, graph } = await loadGraph({
      'index.js': `import './a'; import('./a');`,
      'a.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(owners(plan, 'a')).toEqual(['/app/index.js']);
    expect(plan.chunks).toHaveLength(1);
    expect(plan.requiredChunksByEntryPath.get('/app/a.js')).toEqual([plan.chunks[0]]);
  });

  it('allows an entry module to be owned by another route while retaining semantic requirements', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a');`,
      'a.js': `import './b'; import('./b');`,
      'b.js': '',
    });
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(owners(plan, 'b')).toEqual(['/app/a.js']);
    expect(plan.requiredChunksByEntryPath.get('/app/b.js')!.map((c) => c.dependentEntries)).toEqual(
      [1n]
    );
  });

  it('does not mutate the graph or depend on entry/root/dependency insertion order', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a'); import('./b');`,
      'a.js': `import './shared';`,
      'b.js': `import './shared';`,
      'shared.js': '',
    });
    const originalDependencies = [...graph.dependencies].map(([path, m]) => [
      path,
      [...m.dependencies],
      m.output,
    ]);
    const originalPlan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(
      [...graph.dependencies].map(([path, m]) => [path, [...m.dependencies], m.output])
    ).toEqual(originalDependencies);
    const reversedDependencies = new Map(
      [...graph.dependencies]
        .reverse()
        .map(([path, m]) => [path, { ...m, dependencies: new Map([...m.dependencies].reverse()) }])
    );
    const reorderedPlan = computeBitSetChunkPlan(
      [entry],
      { ...graph, dependencies: reversedDependencies },
      { isLazyBundle: false }
    );
    const getPlanSignature = (plan: typeof originalPlan) =>
      plan.chunks.map((c) => [c.dependentEntries, [...c.modules].map((m) => m.path)]);
    expect(getPlanSignature(reorderedPlan)).toEqual(getPlanSignature(originalPlan));
    expect(owners(reorderedPlan, 'shared')).toEqual(['/app/a.js', '/app/b.js']);
  });

  it('uses an independent atom domain wider than 128 bits', async () => {
    const fs: Record<string, string> = { 'index.js': '' };
    for (let route = 0; route < 8; route++) {
      fs['index.js'] += `import('./route${route}');`;
      fs[`route${route}.js`] = '';
      for (let mask = 1; mask <= 129; mask++) {
        if (mask & (1 << route)) fs[`route${route}.js`] += `import './dep${mask}';`;
        fs[`dep${mask}.js`] = '';
      }
    }
    const { entry, graph } = await loadGraph(fs);
    const plan = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(plan.entryPoints).toHaveLength(9);
    expect(plan.rawAtoms).toHaveLength(130);
    expect(plan.chunks).toHaveLength(130);
    expect(owners(plan, 'dep129')).toEqual(['/app/route0.js', '/app/route7.js']);
    expect(plan.staticAtoms[8]! >> 128n).toBe(0b11n);
  });
});

describe('raw entrypoint reachability', () => {
  it('marks a static closure and terminates its cycle', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import './a';`,
      'a.js': `import './b';`,
      'b.js': `import './a';`,
    });
    const analysis = analyzeBitSetGraph([entry], graph, { isLazyBundle: false });
    expect(analysis.entryPoints.map((e) => [e.module.path, e.kind])).toEqual([
      ['/app/index.js', 'initial'],
    ]);
    expect([...analysis.dependentEntriesByModule].map(([m, bits]) => [m.path, bits])).toEqual([
      ['/app/a.js', 1n],
      ['/app/b.js', 1n],
      ['/app/index.js', 1n],
    ]);
  });

  it('sorts entries by path and stops parent reachability at async edges', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./b'); import('./a');`,
      'a.js': `import './shared';`,
      'b.js': `import './shared';`,
      'shared.js': '',
    });
    const analysis = analyzeBitSetGraph([entry], graph, { isLazyBundle: false });
    expect(analysis.entryPoints.map((e) => e.module.path)).toEqual([
      '/app/a.js',
      '/app/b.js',
      '/app/index.js',
    ]);
    expect(analysis.dependentEntriesByModule.get(entry)).toBe(0b100n);
    expect(analysis.dependentEntriesByModule.get(graph.dependencies.get('/app/a.js')!)).toBe(
      0b001n
    );
    expect(analysis.dependentEntriesByModule.get(graph.dependencies.get('/app/shared.js')!)).toBe(
      0b011n
    );
  });

  it.each(['async', 'maybeSync', 'prefetch'] as const)(
    'discovers %s entries',
    async (asyncType) => {
      const { entry, graph } = await loadGraph({ 'index.js': `import('./a');`, 'a.js': '' });
      for (const [key, dep] of entry.dependencies) {
        if (dep.data.data.asyncType === 'async') {
          entry.dependencies.set(key, {
            ...dep,
            data: { ...dep.data, data: { ...dep.data.data, asyncType } },
          });
        }
      }
      const analysis = analyzeBitSetGraph([entry], graph, { isLazyBundle: false });
      expect(analysis.entryPoints.map((e) => [e.module.path, e.kind])).toEqual([
        ['/app/a.js', 'dynamic'],
        ['/app/index.js', 'initial'],
      ]);
      expect(analysis.importerEntriesByDynamicEntry).toEqual([0b10n, 0n]);
      expect(analysis.dynamicImportsByEntry).toEqual([0n, 0b01n]);
    }
  );

  it('keeps an initial target initial and deduplicates root paths', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a');`,
      'a.js': `import('./index');`,
    });
    const analysis = analyzeBitSetGraph([entry, { ...entry }], graph, { isLazyBundle: false });
    expect(analysis.entryPoints.map((e) => [e.module.path, e.kind])).toEqual([
      ['/app/a.js', 'dynamic'],
      ['/app/index.js', 'initial'],
    ]);
    expect(analysis.importerEntriesByDynamicEntry).toEqual([0b10n, 0n]);
    expect(analysis.dynamicImportsByEntry).toEqual([0n, 0b01n]);
  });

  it('tracks every entry context reaching an importer module', async () => {
    // Rollup 89bda2cd: improved-dynamic-chunks/multi-entry-shared-static-with-dynamic-import.
    // Use async routes to model Rollup's separate entrypoints.
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a'); import('./b');`,
      'a.js': `import './importer';`,
      'b.js': `import './importer';`,
      'importer.js': `import('./c');`,
      'c.js': '',
    });
    const analysis = analyzeBitSetGraph([entry], graph, { isLazyBundle: false });
    expect(analysis.entryPoints.map((e) => e.module.path)).toEqual([
      '/app/a.js',
      '/app/b.js',
      '/app/c.js',
      '/app/index.js',
    ]);
    expect(analysis.importerEntriesByDynamicEntry).toEqual([0b1000n, 0b1000n, 0b0011n, 0n]);
    expect(analysis.dynamicImportsByEntry).toEqual([0b0100n, 0b0100n, 0n, 0b0011n]);
  });

  it('excludes weak-only and worker-only modules from the page domain', async () => {
    const { entry, graph } = await loadGraph(
      {
        'index.js': `require.resolveWeak('./weak'); require.unstable_resolveWorker('./worker');`,
        'weak.js': `import('./hidden');`,
        'worker.js': `import './worker-dep';`,
        'hidden.js': '',
        'worker-dep.js': '',
      },
      true
    );
    const analysis = analyzeBitSetGraph([entry], graph, { isLazyBundle: false });
    expect(analysis.entryPoints.map((e) => e.module.path)).toEqual(['/app/index.js']);
    for (const name of ['weak', 'hidden', 'worker', 'worker-dep']) {
      expect(
        analysis.dependentEntriesByModule.has(graph.dependencies.get(`/app/${name}.js`)!)
      ).toBe(false);
    }
  });

  it('skips unresolved and absent weak dependencies', async () => {
    const { entry, graph } = await loadGraph({
      'index.js': `import('./a'); require.resolveWeak('./weak');`,
      'a.js': '',
      'weak.js': '',
    });
    for (const [key, dep] of entry.dependencies) {
      if (dep.data.data.asyncType === 'async') entry.dependencies.set(key, { data: dep.data });
    }
    const dependencies = new Map(graph.dependencies);
    dependencies.delete('/app/weak.js');
    const analysis = analyzeBitSetGraph(
      [entry],
      { ...graph, dependencies },
      { isLazyBundle: false }
    );
    expect(analysis.entryPoints.map((e) => e.module.path)).toEqual(['/app/index.js']);
  });

  it.each([`import './missing';`, `import('./missing');`])(
    'diagnoses a missing resolved target: %s',
    async (code) => {
      const { entry, graph } = await loadGraph({ 'index.js': code, 'missing.js': '' });
      const dependencies = new Map(graph.dependencies);
      dependencies.delete('/app/missing.js');
      expect(() =>
        analyzeBitSetGraph([entry], { ...graph, dependencies }, { isLazyBundle: false })
      ).toThrow(/\/app\/index\.js.*\/app\/missing\.js.*complete.*graph/);
    }
  );

  it('rejects a lazy graph before traversing it', async () => {
    const { entry, graph } = await loadGraph({ 'index.js': '' });
    expect(() => analyzeBitSetGraph([entry], graph, { isLazyBundle: true })).toThrow(/non-lazy/);
    expect(() => analyzeBitSetGraph([], graph, { isLazyBundle: false })).toThrow(/initial entry/);
  });

  it('keeps entry bits beyond 64 distinct through normalization', async () => {
    const fs: Record<string, string> = { 'index.js': '', 'shared.js': '' };
    for (let index = 0; index < 65; index++) {
      const name = `route${String(index).padStart(2, '0')}`;
      fs['index.js'] += `import('./${name}');`;
      fs[`${name}.js`] = `import './shared';`;
    }
    const { entry, graph } = await loadGraph(fs);
    const analysis = computeBitSetChunkPlan([entry], graph, { isLazyBundle: false });
    expect(analysis.entryPoints).toHaveLength(66);
    expect(analysis.chunks).toHaveLength(67);
    expect(analysis.dependentEntriesByModule.get(graph.dependencies.get('/app/route64.js')!)).toBe(
      0x20000000000000000n
    );
    expect(analysis.dependentEntriesByModule.get(graph.dependencies.get('/app/shared.js')!)).toBe(
      0x3fffffffffffffffen
    );
    expect(
      analysis.chunkByModule.get(graph.dependencies.get('/app/shared.js')!)!.dependentEntries
    ).toBe(0x3fffffffffffffffen);
  });
});
