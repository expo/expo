import { encode } from '@jridgewell/sourcemap-codec';

import {
  PackedMap,
  countLinesAndTerminateSourceMap,
  emptySourceMap,
  installPackedMap,
  isSerializableSourceMap,
  makeProxy,
  materializeMap,
  packDecodedMappings,
  packRawMappings,
  patchTransformFileForPackedMaps,
  tupleAt,
  wrapTransformResultMaps,
  type SerializableSourceMap,
} from '../packedMap';

const STRIDE = 5;
const SENTINEL = -1;

// Build a wire object directly so byte-level tests have full control.
function wire(opts: {
  segments: (
    | [number, number]
    | [number, number, number, number]
    | [number, number, number, number, string]
  )[];
}): SerializableSourceMap {
  const names = new Map<string, number>();
  const out: number[] = new Array(opts.segments.length * STRIDE);
  let off = 0;
  for (const seg of opts.segments) {
    out[off] = seg[0];
    out[off + 1] = seg[1];
    if (seg.length === 2) {
      out[off + 2] = SENTINEL;
      out[off + 3] = SENTINEL;
      out[off + 4] = SENTINEL;
    } else {
      out[off + 2] = seg[2];
      out[off + 3] = seg[3];
      if (seg.length === 5) {
        let idx = names.get(seg[4]);
        if (idx === undefined) {
          idx = names.size;
          names.set(seg[4], idx);
        }
        out[off + 4] = idx;
      } else {
        out[off + 4] = SENTINEL;
      }
    }
    off += STRIDE;
  }
  return {
    __version: 1,
    __count: opts.segments.length,
    __names: [...names.keys()],
    __packed: out,
  };
}

describe('isSerializableSourceMap', () => {
  it('accepts a valid wire object', () => {
    expect(isSerializableSourceMap(wire({ segments: [[1, 0]] }))).toBe(true);
  });

  it('rejects plain values', () => {
    expect(isSerializableSourceMap(null)).toBe(false);
    expect(isSerializableSourceMap(undefined)).toBe(false);
    expect(isSerializableSourceMap('foo')).toBe(false);
    expect(isSerializableSourceMap([])).toBe(false);
    expect(isSerializableSourceMap([[1, 0]])).toBe(false);
  });

  it('rejects objects with the wrong version', () => {
    const w = wire({ segments: [[1, 0]] });
    expect(isSerializableSourceMap({ ...w, __version: 0 })).toBe(false);
    expect(isSerializableSourceMap({ ...w, __version: 2 })).toBe(false);
  });

  it('rejects malformed wire objects', () => {
    const w = wire({ segments: [[1, 0]] });
    expect(isSerializableSourceMap({ ...w, __packed: 'not-array' })).toBe(false);
    expect(isSerializableSourceMap({ ...w, __names: 'not-array' })).toBe(false);
    expect(isSerializableSourceMap({ ...w, __count: 'not-number' })).toBe(false);
  });
});

describe('PackedMap', () => {
  it('round-trips through the wire form', () => {
    const original = wire({
      segments: [
        [1, 0],
        [1, 5, 3, 2, 'foo'],
        [2, 0, 4, 0],
      ],
    });
    const p = PackedMap.deserialize(original);
    expect(p.serialize()).toEqual(original);
  });

  it('exposes the data as an Int32Array', () => {
    const original = wire({ segments: [[1, 0, 1, 0]] });
    const p = PackedMap.deserialize(original);
    expect(p.buf).toBeInstanceOf(Int32Array);
    expect(p.buf).toBe(p.buf);
  });
});

describe('tupleAt', () => {
  it('returns length-2 for sourceless segments', () => {
    const p = PackedMap.deserialize(wire({ segments: [[7, 4]] }));
    expect(tupleAt(p, 0)).toEqual([7, 4]);
    expect(tupleAt(p, 0)!.length).toBe(2);
  });

  it('returns length-4 for sourced-without-name segments', () => {
    const p = PackedMap.deserialize(wire({ segments: [[7, 4, 2, 0]] }));
    expect(tupleAt(p, 0)).toEqual([7, 4, 2, 0]);
    expect(tupleAt(p, 0)!.length).toBe(4);
  });

  it('returns length-5 for sourced+named segments', () => {
    const p = PackedMap.deserialize(wire({ segments: [[7, 4, 2, 0, 'greet']] }));
    expect(tupleAt(p, 0)).toEqual([7, 4, 2, 0, 'greet']);
    expect(tupleAt(p, 0)!.length).toBe(5);
  });

  it('returns undefined for out-of-bounds indices (does not throw)', () => {
    const p = PackedMap.deserialize(wire({ segments: [[1, 0]] }));
    expect(tupleAt(p, -1)).toBeUndefined();
    expect(tupleAt(p, 1)).toBeUndefined();
    expect(tupleAt(p, 100)).toBeUndefined();
  });

  it('throws a clear error for a corrupt name index (out-of-range)', () => {
    // The packer would never produce this, but a corrupt cache entry could.
    const corrupt: SerializableSourceMap = {
      __version: 1,
      __count: 1,
      __names: ['only-name'],
      __packed: [1, 0, 1, 0, 5],
    };
    const p = PackedMap.deserialize(corrupt);
    expect(() => tupleAt(p, 0)).toThrow(/wire entry is corrupt|name index/);
  });
});

describe('makeProxy', () => {
  function buildProxy(segments: Parameters<typeof wire>[0]['segments']) {
    return makeProxy(PackedMap.deserialize(wire({ segments })));
  }

  it('Array.isArray returns true', () => {
    expect(Array.isArray(buildProxy([[1, 0]]))).toBe(true);
  });

  it('length matches __count', () => {
    expect(buildProxy([]).length).toBe(0);
    expect(buildProxy([[1, 0]]).length).toBe(1);
    expect(
      buildProxy([
        [1, 0],
        [2, 0],
        [3, 0],
      ]).length
    ).toBe(3);
  });

  it('numeric indexing returns variable-length tuples', () => {
    const p = buildProxy([
      [1, 0],
      [1, 5, 3, 2],
      [2, 0, 4, 0, 'foo'],
    ]);
    expect(p[0]).toEqual([1, 0]);
    expect(p[1]).toEqual([1, 5, 3, 2]);
    expect(p[2]).toEqual([2, 0, 4, 0, 'foo']);
  });

  it("symbolicate's `mapping.length < 4` check sees sourceless mappings correctly", () => {
    const p = buildProxy([
      [1, 0],
      [2, 0, 4, 0],
    ]);
    expect(p[0]!.length < 4).toBe(true);
    expect(p[1]!.length < 4).toBe(false);
  });

  it('Symbol.iterator yields the same sequence as direct indexing', () => {
    const p = buildProxy([
      [1, 0],
      [2, 0, 4, 0],
      [3, 0, 5, 1, 'x'],
    ]);
    expect([...p]).toEqual([p[0], p[1], p[2]]);
  });

  it('spread produces a plain Array of variable-length tuples', () => {
    const p = buildProxy([
      [1, 0],
      [2, 0, 4, 0],
    ]);
    const arr = [...p];
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toEqual([
      [1, 0],
      [2, 0, 4, 0],
    ]);
  });

  it('Array.from produces the same plain Array', () => {
    const p = buildProxy([
      [1, 0],
      [2, 0, 4, 0],
    ]);
    expect(Array.from(p)).toEqual([
      [1, 0],
      [2, 0, 4, 0],
    ]);
  });

  it('JSON.stringify returns the wire shape, not materialized tuples', () => {
    // A downstream consumer that stringifies and re-feeds through the
    // wrapper must see the wire form, so the `__packed` detector fires
    // on the round-trip rather than treating the materialized tuples as
    // a fresh plain-tuple Array.
    const original = wire({
      segments: [
        [1, 0],
        [2, 0, 4, 0, 'foo'],
      ],
    });
    const p = makeProxy(PackedMap.deserialize(original));
    const json = JSON.stringify(p);
    const parsed = JSON.parse(json);
    expect(isSerializableSourceMap(parsed)).toBe(true);
    expect(parsed).toEqual(original);
  });

  it('util.inspect.custom produces a friendly representation', () => {
    const p = buildProxy([
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
    const fn = (p as unknown as Record<symbol, () => string>)[
      Symbol.for('nodejs.util.inspect.custom')
    ];
    expect(typeof fn).toBe('function');
    expect(fn.call(p)).toBe('PackedMap(count=3)');
  });

  it('write attempts throw', () => {
    const p = buildProxy([[1, 0]]);
    expect(() => {
      (p as any)[0] = [9, 9];
    }).toThrow(/read-only/);
    expect(() => {
      (p as any).length = 0;
    }).toThrow(/read-only/);
    expect(() => {
      (p as any).push([5, 5]);
    }).toThrow(/read-only/);
  });

  it('Object.keys returns numeric-string keys with length === count', () => {
    const p = buildProxy([
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
    expect(Object.keys(p)).toEqual(['0', '1', '2']);
    expect(Object.keys(p).length).toBe(p.length);
  });

  describe('edge cases', () => {
    it('zero-segment module', () => {
      const p = buildProxy([]);
      expect(p.length).toBe(0);
      expect([...p]).toEqual([]);
      expect(Object.keys(p)).toEqual([]);
      expect(JSON.parse(JSON.stringify(p)).__count).toBe(0);
    });

    it('single sourceless segment', () => {
      const p = buildProxy([[1, 0]]);
      expect(p.length).toBe(1);
      expect(p[0]).toEqual([1, 0]);
      expect([...p]).toEqual([[1, 0]]);
    });
  });
});

describe('emptySourceMap', () => {
  it('returns a fresh empty wire object each call', () => {
    const a = emptySourceMap();
    const b = emptySourceMap();
    expect(a).toEqual({ __version: 1, __count: 0, __names: [], __packed: [] });
    expect(a).not.toBe(b);
    expect(a.__packed).not.toBe(b.__packed);
    expect(a.__names).not.toBe(b.__names);
  });
});

describe('packRawMappings', () => {
  it('packs Babel rawMappings directly to wire (sourceless / sourced / named)', () => {
    const w = packRawMappings([
      { generated: { line: 1, column: 0 } },
      { generated: { line: 1, column: 5 }, original: { line: 3, column: 2 }, source: 'a.js' },
      {
        generated: { line: 2, column: 0 },
        original: { line: 5, column: 0 },
        source: 'a.js',
        name: 'foo',
      },
    ]);
    expect(w.__count).toBe(3);
    expect(w.__names).toEqual(['foo']);
    const p = PackedMap.deserialize(w);
    expect(tupleAt(p, 0)).toEqual([1, 0]);
    expect(tupleAt(p, 1)).toEqual([1, 5, 3, 2]);
    expect(tupleAt(p, 2)).toEqual([2, 0, 5, 0, 'foo']);
  });

  it('treats a non-string name as no name (length-4 tuple)', () => {
    const w = packRawMappings([
      // `name: null` shows up in some Babel paths for sourced-without-name.
      { generated: { line: 1, column: 0 }, original: { line: 1, column: 0 }, name: null } as any,
    ]);
    const p = PackedMap.deserialize(w);
    expect(tupleAt(p, 0)).toEqual([1, 0, 1, 0]);
    expect(w.__names).toEqual([]);
  });

  it('returns an empty wire for empty input', () => {
    const w = packRawMappings([]);
    expect(w.__count).toBe(0);
    expect(w.__names).toEqual([]);
    expect(w.__packed).toEqual([]);
  });

  it('deduplicates names in the output array', () => {
    const w = packRawMappings([
      {
        generated: { line: 1, column: 0 },
        original: { line: 1, column: 0 },
        source: 'a',
        name: 'foo',
      },
      {
        generated: { line: 2, column: 0 },
        original: { line: 2, column: 0 },
        source: 'a',
        name: 'foo',
      },
      {
        generated: { line: 3, column: 0 },
        original: { line: 3, column: 0 },
        source: 'a',
        name: 'bar',
      },
    ]);
    expect(w.__names).toEqual(['foo', 'bar']);
  });
});

describe('packDecodedMappings', () => {
  it('decodes a VLQ mappings string straight to wire (1-based line conversion)', () => {
    // Mappings authored at 0-based lines: line 0 col 0 -> src 0 / line 0 / col 0
    //                                     line 1 col 0 -> src 0 / line 1 / col 0 / name 0
    const mappings = encode([[[0, 0, 0, 0]], [[0, 0, 1, 0, 0]]]);
    const w = packDecodedMappings({ mappings, names: ['greet'] });
    expect(w.__count).toBe(2);
    expect(w.__names).toEqual(['greet']);
    const p = PackedMap.deserialize(w);
    // Output is 1-based for source line/col
    expect(tupleAt(p, 0)).toEqual([1, 0, 1, 0]);
    expect(tupleAt(p, 1)).toEqual([2, 0, 2, 0, 'greet']);
  });

  it('handles sourceless segments (length-1 in decoded form → length-2 tuple)', () => {
    const mappings = encode([[[0]]]);
    const w = packDecodedMappings({ mappings, names: [] });
    expect(w.__count).toBe(1);
    const p = PackedMap.deserialize(w);
    expect(tupleAt(p, 0)).toEqual([1, 0]);
  });

  it('returns an empty wire for an empty mappings string', () => {
    const w = packDecodedMappings({ mappings: '', names: [] });
    expect(w.__count).toBe(0);
    expect(w.__packed).toEqual([]);
  });

  it('clones the names input rather than aliasing it', () => {
    const names = ['foo'];
    const w = packDecodedMappings({ mappings: '', names });
    expect(w.__names).not.toBe(names);
    expect(w.__names).toEqual(['foo']);
  });
});

describe('countLinesAndTerminateSourceMap', () => {
  it('returns lineCount=1 for an empty string', () => {
    const w = emptySourceMap();
    const r = countLinesAndTerminateSourceMap('', w);
    expect(r.lineCount).toBe(1);
    expect(r.sourceMap.__count).toBe(1);
    // Terminator at (line 1, col 0)
    expect(r.sourceMap.__packed.slice(0, 5)).toEqual([1, 0, SENTINEL, SENTINEL, SENTINEL]);
  });

  it('counts \\n / \\r\\n / U+2028 / U+2029', () => {
    expect(countLinesAndTerminateSourceMap('a\nb', emptySourceMap()).lineCount).toBe(2);
    expect(countLinesAndTerminateSourceMap('a\r\nb\rc', emptySourceMap()).lineCount).toBe(3);
    expect(countLinesAndTerminateSourceMap('a b', emptySourceMap()).lineCount).toBe(2);
    expect(countLinesAndTerminateSourceMap('a b', emptySourceMap()).lineCount).toBe(2);
  });

  it('appends a terminator when the last segment is not at (lastLine, lastCol)', () => {
    const w = packRawMappings([
      { generated: { line: 1, column: 0 }, original: { line: 1, column: 0 }, source: 'a' },
    ]);
    const r = countLinesAndTerminateSourceMap('abc\nxyz', w);
    expect(r.lineCount).toBe(2);
    expect(r.sourceMap.__count).toBe(2);
    // Terminator: line=2, col=3 (length of "xyz")
    const off = STRIDE; // second segment starts at offset 5
    expect(r.sourceMap.__packed.slice(off, off + 5)).toEqual([2, 3, SENTINEL, SENTINEL, SENTINEL]);
  });

  it('does not append a redundant terminator when the last segment already ends at the position', () => {
    // Last segment ends at (line 2, col 3); for "abc\nxyz" that's the end-of-file.
    const w = packRawMappings([
      { generated: { line: 1, column: 0 }, original: { line: 1, column: 0 }, source: 'a' },
      { generated: { line: 2, column: 3 } },
    ]);
    const r = countLinesAndTerminateSourceMap('abc\nxyz', w);
    expect(r.lineCount).toBe(2);
    expect(r.sourceMap.__count).toBe(2);
    expect(r.sourceMap).toBe(w);
  });
});

describe('materializeMap', () => {
  it('materializes wire to plain tuples', () => {
    const w = wire({
      segments: [
        [1, 0],
        [2, 0, 4, 0, 'foo'],
      ],
    });
    expect(materializeMap(w)).toEqual([
      [1, 0],
      [2, 0, 4, 0, 'foo'],
    ]);
  });

  it('materializes a Proxy to plain tuples (via Symbol.iterator)', () => {
    const p = makeProxy(PackedMap.deserialize(wire({ segments: [[1, 0]] })));
    expect(materializeMap(p)).toEqual([[1, 0]]);
  });

  it('passes through plain tuple arrays', () => {
    const tuples: any = [
      [1, 0],
      [2, 0, 4, 0],
    ];
    expect(materializeMap(tuples)).toEqual(tuples);
  });

  it('handles null/undefined gracefully', () => {
    expect(materializeMap(null)).toEqual([]);
    expect(materializeMap(undefined)).toEqual([]);
  });
});

describe('installPackedMap', () => {
  it('installs from wire input', () => {
    const data: any = {};
    installPackedMap(data, wire({ segments: [[1, 0, 1, 0]] }));
    expect(Array.isArray(data.map)).toBe(true);
    expect(data.map[0]).toEqual([1, 0, 1, 0]);
    expect(data.__packedMap).toBeInstanceOf(PackedMap);
  });

  it('installs from tuple input (the reconcile path)', () => {
    const data: any = {};
    installPackedMap(data, [
      [1, 0],
      [2, 0, 4, 0, 'foo'],
    ]);
    expect(data.map.length).toBe(2);
    expect(data.map[0]).toEqual([1, 0]);
    expect(data.map[1]).toEqual([2, 0, 4, 0, 'foo']);
    expect(data.__packedMap).toBeInstanceOf(PackedMap);
  });

  it('attaches __packedMap as non-enumerable', () => {
    const data: any = {};
    installPackedMap(data, [[1, 0, 1, 0]]);
    expect(Object.keys(data)).toEqual(['map']);
    expect({ ...data }.__packedMap).toBeUndefined();
  });

  it('is idempotent — replaces a previously-installed map cleanly', () => {
    const data: any = {};
    installPackedMap(data, [[1, 0, 1, 0]]);
    const firstPacked = data.__packedMap;
    installPackedMap(data, [
      [1, 0],
      [2, 0],
    ]);
    expect(data.map.length).toBe(2);
    expect(data.__packedMap).not.toBe(firstPacked);
  });

  it('exposes `data.map` as a lazy accessor (Proxy not allocated until first read)', () => {
    const data: any = {};
    installPackedMap(data, [[1, 0, 1, 0]]);
    const descriptor = Object.getOwnPropertyDescriptor(data, 'map')!;
    expect(typeof descriptor.get).toBe('function');
    expect('value' in descriptor).toBe(false);
    expect(data.__packedMap).toBeInstanceOf(PackedMap);
  });

  it('caches the Proxy on first read so identity is stable', () => {
    const data: any = {};
    installPackedMap(data, [[1, 0, 1, 0]]);
    const first = data.map;
    expect(data.map).toBe(first);
    expect({ ...data }.map).toBe(first);
  });
});

describe('wrapTransformResultMaps', () => {
  it('replaces wire `data.map` with a Proxy + non-enumerable __packedMap', () => {
    const result = {
      output: [
        {
          type: 'js/module',
          data: {
            code: 'foo',
            lineCount: 1,
            map: wire({ segments: [[1, 0, 1, 0]] }),
            functionMap: null,
          },
        },
      ],
    };
    const wrapped = wrapTransformResultMaps(result);
    const data = wrapped.output[0]!.data as any;
    expect(Array.isArray(data.map)).toBe(true);
    expect(data.map.length).toBe(1);
    expect(data.map[0]).toEqual([1, 0, 1, 0]);

    // __packedMap is attached non-enumerably, so spread/Object.keys ignore it.
    expect(data.__packedMap).toBeInstanceOf(PackedMap);
    expect(Object.keys(data)).not.toContain('__packedMap');
    expect({ ...data }.__packedMap).toBeUndefined();
  });

  it('leaves non-wire `data.map` (legacy plain tuples) alone', () => {
    const tuples: [number, number, number, number][] = [[1, 0, 1, 0]];
    const result = {
      output: [
        {
          type: 'js/module',
          data: { code: 'foo', lineCount: 1, map: tuples, functionMap: null },
        },
      ],
    };
    const wrapped = wrapTransformResultMaps(result);
    const data = wrapped.output[0]!.data as any;
    expect(data.map).toBe(tuples);
    expect(data.__packedMap).toBeUndefined();
  });

  it('handles results with no output gracefully', () => {
    expect(wrapTransformResultMaps({ output: null as any })).toEqual({ output: null });
    expect(wrapTransformResultMaps({} as any)).toEqual({});
  });

  it('short-circuits on already-wrapped data without invoking the lazy `data.map` getter', () => {
    const result: any = {
      output: [
        {
          type: 'js/module',
          data: {
            code: '',
            lineCount: 1,
            map: wire({ segments: [[1, 0, 1, 0]] }),
            functionMap: null,
          },
        },
      ],
    };
    wrapTransformResultMaps(result);

    const data = result.output[0].data;
    let getInvocations = 0;
    const originalDescriptor = Object.getOwnPropertyDescriptor(data, 'map')!;
    Object.defineProperty(data, 'map', {
      get() {
        getInvocations++;
        return originalDescriptor.get!.call(data);
      },
      enumerable: true,
      configurable: true,
    });

    wrapTransformResultMaps(result);
    expect(getInvocations).toBe(0);
  });
});

describe('patchTransformFileForPackedMaps', () => {
  it('wraps every result returned by the patched bundler', async () => {
    const result1 = {
      output: [
        {
          type: 'js/module',
          data: {
            map: wire({ segments: [[1, 0, 1, 0]] }),
            code: '',
            lineCount: 1,
            functionMap: null,
          },
        },
      ],
    };
    const result2 = {
      output: [
        {
          type: 'js/module',
          data: {
            map: wire({ segments: [[2, 0, 2, 0]] }),
            code: '',
            lineCount: 1,
            functionMap: null,
          },
        },
      ],
    };
    const calls: any[] = [];
    const bundler: any = {
      async transformFile(...args: unknown[]) {
        calls.push(args);
        return calls.length === 1 ? result1 : result2;
      },
    };
    patchTransformFileForPackedMaps(bundler);

    const r1 = await bundler.transformFile('/a.js');
    const r2 = await bundler.transformFile('/b.js');

    expect(Array.isArray(r1.output[0].data.map)).toBe(true);
    expect(r1.output[0].data.__packedMap).toBeInstanceOf(PackedMap);
    expect(Array.isArray(r2.output[0].data.map)).toBe(true);
    expect(r2.output[0].data.__packedMap).toBeInstanceOf(PackedMap);
    expect(calls).toEqual([['/a.js'], ['/b.js']]);
  });

  it('chains cleanly with a pre-existing patch (no double-wrap on the second pass)', async () => {
    const bundler: any = {
      async transformFile() {
        return {
          output: [
            {
              type: 'js/module',
              data: {
                map: wire({ segments: [[1, 0, 1, 0]] }),
                code: '',
                lineCount: 1,
                functionMap: null,
              },
            },
          ],
        };
      },
    };
    patchTransformFileForPackedMaps(bundler);
    patchTransformFileForPackedMaps(bundler);

    const r = await bundler.transformFile('/a.js');
    expect(r.output[0].data.__packedMap).toBeInstanceOf(PackedMap);
    expect(r.output[0].data.map.length).toBe(1);
  });
});
