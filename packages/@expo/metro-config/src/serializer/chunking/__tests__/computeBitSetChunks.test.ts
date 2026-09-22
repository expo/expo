import { microBundle } from '../../fork/__tests__/mini-metro';
import {
  addBit,
  allBits,
  analyzeBitSetGraph,
  bitIndices,
  hasBit,
  removeBit,
} from '../computeBitSetChunks';

async function loadGraph(fs: Record<string, string>) {
  const [entryPath, , graph] = await microBundle({
    fs,
    options: { platform: 'web', dev: false, splitChunks: true },
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
    [64, 0xffffffffffffffffn],
    [65, 0x1ffffffffffffffffn],
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
    const { entry, graph } = await loadGraph({
      'index.js': `require.resolveWeak('./weak'); require.unstable_resolveWorker('./worker');`,
      'weak.js': `import('./hidden');`,
      'worker.js': `import './worker-dep';`,
      'hidden.js': '',
      'worker-dep.js': '',
    });
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

  it('keeps entry bits beyond 64 distinct', async () => {
    const fs: Record<string, string> = { 'index.js': '', 'shared.js': '' };
    for (let index = 0; index < 65; index++) {
      const name = `route${String(index).padStart(2, '0')}`;
      fs['index.js'] += `import('./${name}');`;
      fs[`${name}.js`] = `import './shared';`;
    }
    const { entry, graph } = await loadGraph(fs);
    const analysis = analyzeBitSetGraph([entry], graph, { isLazyBundle: false });
    expect(analysis.entryPoints).toHaveLength(66);
    expect(analysis.dependentEntriesByModule.get(graph.dependencies.get('/app/route64.js')!)).toBe(
      0x20000000000000000n
    );
    expect(analysis.dependentEntriesByModule.get(graph.dependencies.get('/app/shared.js')!)).toBe(
      0x3fffffffffffffffen
    );
  });
});
