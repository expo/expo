/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Compact, Array-compatible storage for a module's per-segment sourcemap
// data, replacing the per-segment heap-allocated tuple Array on
// `module.output[0].data.map`. The Proxy preserves every reader's access
// pattern (`Array.isArray`, `length`, numeric indices, iteration); the
// encoder fast path in `sourceMap.ts` reads the underlying `Int32Array`
// directly to avoid the per-segment tuple allocation that Proxy
// iteration would otherwise incur.
//
// Wire form (`PackedMapWire`) is JSON-faithful — `Int32Array` doesn't
// round-trip through `JSON` — so workers emit it across IPC and
// `metro-cache` writes it to disk; the `Int32Array` is materialized
// lazily on the main thread on first access.

import type { MetroSourceMapSegmentTuple } from '@expo/metro/metro-source-map';

// Layout per segment, starting at `i * STRIDE`. Fixed stride so segments
// are indexable in O(1); missing fields use sentinel `-1`. Lines are
// 1-based to match `MetroSourceMapSegmentTuple`.
//   [0] generated line
//   [1] generated column
//   [2] source line   (-1 if sourceless)
//   [3] source column (-1 if sourceless)
//   [4] name index    (-1 if no name)
export const STRIDE = 5;
export const SENTINEL = -1;

export interface PackedMapWire {
  __packed: number[];
  __names: string[];
  __count: number;
  __version: 1;
}

export function isPackedWire(x: unknown): x is PackedMapWire {
  if (x == null || typeof x !== 'object') return false;
  const o = x as Partial<PackedMapWire>;
  return (
    o.__version === 1 &&
    Array.isArray(o.__packed) &&
    Array.isArray(o.__names) &&
    typeof o.__count === 'number'
  );
}

export class PackedMap {
  readonly count: number;
  readonly names: string[];
  // `Int32Array` storage: 4 bytes/int off-heap vs 8 bytes/slot for the
  // tagged `number[]` wire form. Materialized eagerly so a `data.map`
  // whose encoder never iterates (e.g. SSR-eval'd modules — the bundle
  // is concatenated and `_compile`-ed without anyone calling `.buf`)
  // doesn't strand a wire-shaped array on the JS heap.
  readonly buf: Int32Array;

  private constructor(buf: Int32Array, names: string[], count: number) {
    this.buf = buf;
    this.names = names;
    this.count = count;
  }

  static fromWire(wire: PackedMapWire): PackedMap {
    return new PackedMap(Int32Array.from(wire.__packed), wire.__names, wire.__count);
  }

  static fromInts(buf: Int32Array, names: string[], count: number): PackedMap {
    return new PackedMap(buf, names, count);
  }

  toWire(): PackedMapWire {
    const buf = this.buf;
    const out: number[] = new Array(buf.length);
    for (let i = 0; i < buf.length; i++) out[i] = buf[i]!;
    return {
      __version: 1,
      __count: this.count,
      __names: this.names.slice(),
      __packed: out,
    };
  }
}

// Returns the variable-length form (2, 4, or 5) that matches Metro's
// tuple union. A fixed-length-5 tuple with `-1` sentinels would fool
// `symbolicate.js`'s `mapping.length < 4` sourceless-check and resolve to
// garbage source positions.
export function tupleAt(p: PackedMap, i: number): MetroSourceMapSegmentTuple | undefined {
  if (i < 0 || i >= p.count) return undefined;
  const buf = p.buf;
  const off = i * STRIDE;
  const genL = buf[off]!;
  const genC = buf[off + 1]!;
  const srcL = buf[off + 2]!;
  if (srcL === SENTINEL) {
    return [genL, genC];
  }
  const srcC = buf[off + 3]!;
  const nameIdx = buf[off + 4]!;
  if (nameIdx === SENTINEL) {
    return [genL, genC, srcL, srcC];
  }
  // A wire object with `nameIdx >= __names.length` is malformed; throw a
  // clear error rather than silently producing `[..., undefined]`, which
  // would corrupt names through the encoder without any obvious symptom.
  const name = p.names[nameIdx];
  if (name === undefined) {
    throw new Error(
      `[expo-metro-config] PackedMap segment ${i} references name index ${nameIdx}, ` +
        `but only ${p.names.length} names exist. The wire entry is corrupt; ` +
        `clear the metro cache (\`expo start --clear\`) and rebuild.`
    );
  }
  return [genL, genC, srcL, srcC, name];
}

function* iterateTuples(p: PackedMap): IterableIterator<MetroSourceMapSegmentTuple> {
  for (let i = 0; i < p.count; i++) {
    yield tupleAt(p, i)!;
  }
}

const NODE_INSPECT = Symbol.for('nodejs.util.inspect.custom');

// Replace `data.map` with the `Array.isArray`-true Proxy and attach the
// underlying `PackedMap` as non-enumerable `data.__packedMap` for the
// encoder fast path. Accepts either a `PackedMapWire` (worker output,
// cache hits) or plain tuples (reconcile-style serializer plugins).
// Idempotent: both fields are defined `configurable: true`, so re-running
// on a previously-installed `data` object is safe.
export function installPackedMap(
  data: { map?: unknown; __packedMap?: PackedMap },
  source: PackedMapWire | readonly MetroSourceMapSegmentTuple[]
): void {
  // Tuple input goes straight to a typed-array-backed `PackedMap` — going
  // via `packTuples` would allocate a `number[]` that
  // `PackedMap.fromWire` would then drop on first `.buf` access.
  const packed = isPackedWire(source) ? PackedMap.fromWire(source) : packTuplesToPackedMap(source);

  // Lazy accessor for `data.map`: builds that never symbolicate (typical
  // CI / quiet dev sessions) read `data.__packedMap` exclusively via the
  // encoder fast path, so the Proxy is never allocated. Cached on first
  // read so consumers that hold onto `data.map` (e.g.
  // `getExplodedSourceMap`) see a stable identity.
  let cachedProxy: MetroSourceMapSegmentTuple[] | undefined;
  Object.defineProperty(data, 'map', {
    get() {
      if (!cachedProxy) cachedProxy = makeProxy(packed);
      return cachedProxy;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(data, '__packedMap', {
    value: packed,
    enumerable: false,
    writable: false,
    configurable: true,
  });
}

// The single chokepoint between "worker emits wire" and "main-thread
// readers expect array-shaped tuples". Used in production via the
// `Bundler.transformFile` patch and called directly in tests.
export function wrapTransformResultMaps<T extends { output?: readonly unknown[] | null }>(
  result: T
): T {
  if (!result || !Array.isArray(result.output)) return result;
  for (const out of result.output) {
    const data = (out as { data?: { map?: unknown; __packedMap?: PackedMap } } | null)?.data;
    if (!data) continue;
    // Skip without touching `data.map` — reading it would fire the lazy
    // getter and materialize a Proxy we don't need.
    if (data.__packedMap) continue;
    if (isPackedWire(data.map)) {
      installPackedMap(data, data.map);
    }
  }
  return result;
}

// Idempotent: chaining is safe because `installPackedMap` only fires
// when `data.map` is still a wire object.
export function patchTransformFileForPackedMaps(bundler: {
  transformFile: (...args: any[]) => Promise<unknown>;
}): void {
  const originalTransformFile = bundler.transformFile.bind(bundler);
  bundler.transformFile = async (...args: any[]) => {
    return wrapTransformResultMaps((await originalTransformFile(...args)) as any);
  };
}

// Materialize any `data.map` shape (wire, Proxy, or plain tuples) into a
// plain `MetroSourceMapSegmentTuple[]`. NOT a hot path — allocates a
// fresh tuple per segment; production readers go through the Proxy or
// the encoder fast path.
export function materializeMap(
  map: PackedMapWire | readonly MetroSourceMapSegmentTuple[] | null | undefined
): MetroSourceMapSegmentTuple[] {
  if (map == null) return [];
  if (isPackedWire(map)) {
    const packed = PackedMap.fromWire(map);
    const out: MetroSourceMapSegmentTuple[] = new Array(packed.count);
    for (let i = 0; i < packed.count; i++) {
      out[i] = tupleAt(packed, i)!;
    }
    return out;
  }
  // The Proxy is `Array.isArray`-true and iterates via `Symbol.iterator`.
  return Array.isArray(map) ? Array.from(map) : [];
}

function indexOrInsert(names: Map<string, number>, name: string): number {
  const existing = names.get(name);
  if (existing !== undefined) return existing;
  const idx = names.size;
  names.set(name, idx);
  return idx;
}

export function packTuples(tuples: readonly MetroSourceMapSegmentTuple[]): PackedMapWire {
  const names = new Map<string, number>();
  const out: number[] = new Array(tuples.length * STRIDE);
  let off = 0;
  for (const tuple of tuples) {
    out[off] = tuple[0];
    out[off + 1] = tuple[1];
    if (tuple.length === 2) {
      out[off + 2] = SENTINEL;
      out[off + 3] = SENTINEL;
      out[off + 4] = SENTINEL;
    } else {
      out[off + 2] = tuple[2];
      out[off + 3] = tuple[3];
      out[off + 4] = tuple.length === 5 ? indexOrInsert(names, tuple[4]) : SENTINEL;
    }
    off += STRIDE;
  }
  return {
    __version: 1,
    __count: tuples.length,
    __names: [...names.keys()],
    __packed: out,
  };
}

// Pack tuples straight into an `Int32Array`-backed `PackedMap`, skipping
// the wire form. Used by `installPackedMap` when the caller already lives
// on the main thread (reconcile, in-memory refits) and never needs the
// JSON-faithful wire shape for IPC.
function packTuplesToPackedMap(tuples: readonly MetroSourceMapSegmentTuple[]): PackedMap {
  const names = new Map<string, number>();
  const buf = new Int32Array(tuples.length * STRIDE);
  let off = 0;
  for (const tuple of tuples) {
    buf[off] = tuple[0];
    buf[off + 1] = tuple[1];
    if (tuple.length === 2) {
      buf[off + 2] = SENTINEL;
      buf[off + 3] = SENTINEL;
      buf[off + 4] = SENTINEL;
    } else {
      buf[off + 2] = tuple[2];
      buf[off + 3] = tuple[3];
      buf[off + 4] = tuple.length === 5 ? indexOrInsert(names, tuple[4]) : SENTINEL;
    }
    off += STRIDE;
  }
  return PackedMap.fromInts(buf, [...names.keys()], tuples.length);
}

// Target is `[]` (a real Array) so `Array.isArray(proxy)` returns true
// per ECMA-262 §7.2.2 — required by Metro's `symbolicate`.
export function makeProxy(packed: PackedMap): MetroSourceMapSegmentTuple[] {
  const target: MetroSourceMapSegmentTuple[] = [];
  const handler: ProxyHandler<MetroSourceMapSegmentTuple[]> = {
    get(_t, prop) {
      if (prop === 'length') return packed.count;
      if (prop === Symbol.iterator) return () => iterateTuples(packed);
      if (prop === 'toJSON') return () => packed.toWire();
      if (prop === NODE_INSPECT) {
        return () => `PackedMap(count=${packed.count})`;
      }
      if (typeof prop === 'string') {
        const n = +prop;
        if (Number.isInteger(n) && String(n) === prop && n >= 0) {
          return tupleAt(packed, n);
        }
      }
      // Array.prototype methods (`forEach`, `map`, …) reach us back
      // through numeric-index `get` and `length`, both covered above.
      return Reflect.get(target, prop);
    },
    has(_t, prop) {
      if (prop === 'length' || prop === Symbol.iterator || prop === 'toJSON') return true;
      if (typeof prop === 'string') {
        const n = +prop;
        if (Number.isInteger(n) && String(n) === prop && n >= 0 && n < packed.count) {
          return true;
        }
      }
      return Reflect.has(target, prop);
    },
    ownKeys(t) {
      const keys = new Array<string>(packed.count);
      for (let i = 0; i < packed.count; i++) keys[i] = String(i);
      return keys.concat(Reflect.ownKeys(t) as string[]);
    },
    getOwnPropertyDescriptor(t, prop) {
      if (typeof prop === 'string') {
        const n = +prop;
        if (Number.isInteger(n) && String(n) === prop && n >= 0 && n < packed.count) {
          return {
            value: tupleAt(packed, n),
            writable: false,
            enumerable: true,
            configurable: true,
          };
        }
      }
      // Delegate `length` to the real Array target so the Proxy invariant
      // for non-configurable own keys holds.
      return Reflect.getOwnPropertyDescriptor(t, prop);
    },
    set() {
      throw new TypeError(
        '[expo-metro-config] data.map is read-only — backed by a PackedMap. ' +
          'Modify the underlying wire or rebuild with a fresh transform instead.'
      );
    },
    deleteProperty() {
      throw new TypeError('[expo-metro-config] data.map is read-only — backed by a PackedMap.');
    },
    defineProperty() {
      throw new TypeError('[expo-metro-config] data.map is read-only — backed by a PackedMap.');
    },
  };
  return new Proxy(target, handler);
}
