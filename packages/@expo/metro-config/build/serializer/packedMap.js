"use strict";
/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackedMap = exports.SENTINEL = exports.STRIDE = void 0;
exports.isSerializableSourceMap = isSerializableSourceMap;
exports.tupleAt = tupleAt;
exports.installPackedMap = installPackedMap;
exports.wrapTransformResultMaps = wrapTransformResultMaps;
exports.patchTransformFileForPackedMaps = patchTransformFileForPackedMaps;
exports.materializeMap = materializeMap;
exports.emptySourceMap = emptySourceMap;
exports.packRawMappings = packRawMappings;
exports.packDecodedMappings = packDecodedMappings;
exports.countLinesAndTerminateSourceMap = countLinesAndTerminateSourceMap;
exports.makeProxy = makeProxy;
// Layout per segment, starting at `i * STRIDE`. Fixed stride so segments
// are indexable in O(1); missing fields use sentinel `-1`. Lines are
// 1-based to match `MetroSourceMapSegmentTuple`.
//   [0] generated line
//   [1] generated column
//   [2] source line   (-1 if sourceless)
//   [3] source column (-1 if sourceless)
//   [4] name index    (-1 if no name)
exports.STRIDE = 5;
exports.SENTINEL = -1;
function isSerializableSourceMap(x) {
    if (x == null || typeof x !== 'object')
        return false;
    const o = x;
    return (o.__version === 1 &&
        Array.isArray(o.__packed) &&
        Array.isArray(o.__names) &&
        typeof o.__count === 'number');
}
class PackedMap {
    count;
    names;
    // `Int32Array` storage: 4 bytes/int off-heap vs 8 bytes/slot for the
    // tagged `number[]` shape that `SerializableSourceMap` carries.
    // Materialized eagerly so a `data.map` whose encoder never iterates
    // (e.g. SSR-eval'd modules — the bundle is concatenated and
    // `_compile`-ed without anyone calling `.buf`) doesn't strand a
    // serialized-shape array on the JS heap.
    buf;
    constructor(buf, names, count) {
        this.buf = buf;
        this.names = names;
        this.count = count;
    }
    static deserialize(input) {
        return new PackedMap(Int32Array.from(input.__packed), input.__names, input.__count);
    }
    static fromInts(buf, names, count) {
        return new PackedMap(buf, names, count);
    }
    serialize() {
        const buf = this.buf;
        const out = new Array(buf.length);
        for (let i = 0; i < buf.length; i++)
            out[i] = buf[i];
        return {
            __version: 1,
            __count: this.count,
            __names: this.names.slice(),
            __packed: out,
        };
    }
}
exports.PackedMap = PackedMap;
// Returns the variable-length form (2, 4, or 5) that matches Metro's
// tuple union. A fixed-length-5 tuple with `-1` sentinels would fool
// `symbolicate.js`'s `mapping.length < 4` sourceless-check and resolve to
// garbage source positions.
function tupleAt(p, i) {
    if (i < 0 || i >= p.count)
        return undefined;
    const buf = p.buf;
    const off = i * exports.STRIDE;
    const genL = buf[off];
    const genC = buf[off + 1];
    const srcL = buf[off + 2];
    if (srcL === exports.SENTINEL) {
        return [genL, genC];
    }
    const srcC = buf[off + 3];
    const nameIdx = buf[off + 4];
    if (nameIdx === exports.SENTINEL) {
        return [genL, genC, srcL, srcC];
    }
    // A `SerializableSourceMap` with `nameIdx >= __names.length` is malformed; throw a
    // clear error rather than silently producing `[..., undefined]`, which
    // would corrupt names through the encoder without any obvious symptom.
    const name = p.names[nameIdx];
    if (name === undefined) {
        throw new Error(`[expo-metro-config] PackedMap segment ${i} references name index ${nameIdx}, ` +
            `but only ${p.names.length} names exist. The serialized entry is corrupt; ` +
            `clear the metro cache (\`expo start --clear\`) and rebuild.`);
    }
    return [genL, genC, srcL, srcC, name];
}
function* iterateTuples(p) {
    for (let i = 0; i < p.count; i++) {
        yield tupleAt(p, i);
    }
}
const NODE_INSPECT = Symbol.for('nodejs.util.inspect.custom');
// Replace `data.map` with the `Array.isArray`-true Proxy and attach the
// underlying `PackedMap` as non-enumerable `data.__packedMap` for the
// encoder fast path. Accepts either a `SerializableSourceMap` (worker output,
// cache hits) or plain tuples (reconcile-style serializer plugins).
// Idempotent: both fields are defined `configurable: true`, so re-running
// on a previously-installed `data` object is safe.
function installPackedMap(data, source) {
    // Tuple input goes straight to a typed-array-backed `PackedMap` — going
    // via `packTuples` would allocate a `number[]` that
    // `PackedMap.deserialize` would then drop on first `.buf` access.
    const packed = isSerializableSourceMap(source)
        ? PackedMap.deserialize(source)
        : packTuplesToPackedMap(source);
    // Lazy accessor for `data.map`: builds that never symbolicate (typical
    // CI / quiet dev sessions) read `data.__packedMap` exclusively via the
    // encoder fast path, so the Proxy is never allocated. Cached on first
    // read so consumers that hold onto `data.map` (e.g.
    // `getExplodedSourceMap`) see a stable identity.
    let cachedProxy;
    Object.defineProperty(data, 'map', {
        get() {
            if (!cachedProxy)
                cachedProxy = makeProxy(packed);
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
// The single chokepoint between "worker emits SerializableSourceMap" and "main-thread
// readers expect array-shaped tuples". Used in production via the
// `Bundler.transformFile` patch and called directly in tests.
function wrapTransformResultMaps(result) {
    if (!result || !Array.isArray(result.output))
        return result;
    for (const out of result.output) {
        const data = out?.data;
        if (!data)
            continue;
        // Skip without touching `data.map` — reading it would fire the lazy
        // getter and materialize a Proxy we don't need.
        if (data.__packedMap)
            continue;
        if (isSerializableSourceMap(data.map)) {
            installPackedMap(data, data.map);
        }
    }
    return result;
}
// Idempotent: chaining is safe because `installPackedMap` only fires
// when `data.map` is still a `SerializableSourceMap`.
function patchTransformFileForPackedMaps(bundler) {
    const originalTransformFile = bundler.transformFile.bind(bundler);
    bundler.transformFile = async (...args) => {
        return wrapTransformResultMaps((await originalTransformFile(...args)));
    };
}
// Materialize any `data.map` shape (serialized, Proxy, or plain tuples) into a
// plain `MetroSourceMapSegmentTuple[]`. NOT a hot path — allocates a
// fresh tuple per segment; production readers go through the Proxy or
// the encoder fast path.
function materializeMap(map) {
    if (map == null)
        return [];
    if (isSerializableSourceMap(map)) {
        const packed = PackedMap.deserialize(map);
        const out = new Array(packed.count);
        for (let i = 0; i < packed.count; i++) {
            out[i] = tupleAt(packed, i);
        }
        return out;
    }
    // The Proxy is `Array.isArray`-true and iterates via `Symbol.iterator`.
    return Array.isArray(map) ? Array.from(map) : [];
}
function indexOrInsert(names, name) {
    const existing = names.get(name);
    if (existing !== undefined)
        return existing;
    const idx = names.size;
    names.set(name, idx);
    return idx;
}
function emptySourceMap() {
    return { __version: 1, __count: 0, __names: [], __packed: [] };
}
// Convert Babel’s `result.rawMappings` directly to a `SerializableSourceMap`. The
// worker's terminal storage is `SerializableSourceMap`, so going via an
// intermediate `MetroSourceMapSegmentTuple[]` (one heap-allocated Array
// per segment) is wasted work; for an N-module bundle averaging M
// segments per module that's N×M transient tuple allocations per
// transform pass. `BabelSourceMapSegment` lines are 1-based (matching
// the serialized shape).
function packRawMappings(rawMappings) {
    const names = new Map();
    const out = new Array(rawMappings.length * exports.STRIDE);
    let off = 0;
    for (const m of rawMappings) {
        out[off] = m.generated.line;
        out[off + 1] = m.generated.column;
        if (m.original == null) {
            out[off + 2] = exports.SENTINEL;
            out[off + 3] = exports.SENTINEL;
            out[off + 4] = exports.SENTINEL;
        }
        else {
            out[off + 2] = m.original.line;
            out[off + 3] = m.original.column;
            out[off + 4] = typeof m.name === 'string' ? indexOrInsert(names, m.name) : exports.SENTINEL;
        }
        off += exports.STRIDE;
    }
    return {
        __version: 1,
        __count: rawMappings.length,
        __names: [...names.keys()],
        __packed: out,
    };
}
// Decode a minifier’s encoded sourcemap straight to a `SerializableSourceMap`. `decode`
// returns 0-based outer indices and 0-based source lines; the serialized form is
// 1-based for both — adjust at the boundary. The minifier already
// deduplicates names, so `input.names` becomes the output `__names`
// directly without re-interning.
function packDecodedMappings(input) {
    const decoded = loadSourceMapCodec().decode(input.mappings);
    let total = 0;
    for (const line of decoded)
        total += line.length;
    const out = new Array(total * exports.STRIDE);
    let off = 0;
    let count = 0;
    for (let lineIdx = 0; lineIdx < decoded.length; lineIdx++) {
        const genLine = lineIdx + 1;
        for (const seg of decoded[lineIdx]) {
            out[off] = genLine;
            out[off + 1] = seg[0];
            if (seg.length === 1) {
                out[off + 2] = exports.SENTINEL;
                out[off + 3] = exports.SENTINEL;
                out[off + 4] = exports.SENTINEL;
            }
            else {
                out[off + 2] = seg[2] + 1;
                out[off + 3] = seg[3];
                out[off + 4] = seg.length === 5 ? seg[4] : exports.SENTINEL;
            }
            off += exports.STRIDE;
            count++;
        }
    }
    return {
        __version: 1,
        __count: count,
        __names: input.names.slice(),
        __packed: out,
    };
}
// Append the trailing `(lineCount+1, lastLineLength)` terminator to the
// `SerializableSourceMap`’s `__packed` if it isn’t already there. Without this, an
// out-of-bounds lookup at the tail of the bundle would alias to the
// last real mapping rather than resolving to nothing — same invariant
// as the legacy tuple-array form, but applied in place on the flat
// `number[]` storage.
//
// ASSUMPTION: Mappings are generated in order of increasing line and
// column.
function countLinesAndTerminateSourceMap(code, sourceMap) {
    const NEWLINE = /\r\n?|\n|\u2028|\u2029/g;
    let lineCount = 1;
    let lastLineStart = 0;
    for (const match of code.matchAll(NEWLINE)) {
        if (match.index == null)
            continue;
        lineCount++;
        lastLineStart = match.index + match[0].length;
    }
    const lastLineLength = code.length - lastLineStart;
    const lastIdx = sourceMap.__count - 1;
    if (lastIdx >= 0) {
        const off = lastIdx * exports.STRIDE;
        if (sourceMap.__packed[off] === lineCount && sourceMap.__packed[off + 1] === lastLineLength) {
            return { lineCount, sourceMap };
        }
    }
    return {
        lineCount,
        sourceMap: {
            __version: 1,
            __count: sourceMap.__count + 1,
            __names: sourceMap.__names,
            __packed: [...sourceMap.__packed, lineCount, lastLineLength, exports.SENTINEL, exports.SENTINEL, exports.SENTINEL],
        },
    };
}
let _sourceMapCodec;
function loadSourceMapCodec() {
    if (!_sourceMapCodec) {
        _sourceMapCodec = require('@jridgewell/sourcemap-codec');
    }
    return _sourceMapCodec;
}
// Pack tuples straight into an `Int32Array`-backed `PackedMap`, skipping
// a `SerializableSourceMap`. Used by `installPackedMap` when the caller already lives
// on the main thread (reconcile, in-memory refits) and never needs the
// JSON-faithful serialized shape for IPC.
function packTuplesToPackedMap(tuples) {
    const names = new Map();
    const buf = new Int32Array(tuples.length * exports.STRIDE);
    let off = 0;
    for (const tuple of tuples) {
        buf[off] = tuple[0];
        buf[off + 1] = tuple[1];
        if (tuple.length === 2) {
            buf[off + 2] = exports.SENTINEL;
            buf[off + 3] = exports.SENTINEL;
            buf[off + 4] = exports.SENTINEL;
        }
        else {
            buf[off + 2] = tuple[2];
            buf[off + 3] = tuple[3];
            buf[off + 4] = tuple.length === 5 ? indexOrInsert(names, tuple[4]) : exports.SENTINEL;
        }
        off += exports.STRIDE;
    }
    return PackedMap.fromInts(buf, [...names.keys()], tuples.length);
}
// Target is `[]` (a real Array) so `Array.isArray(proxy)` returns true
// per ECMA-262 §7.2.2 — required by Metro's `symbolicate`.
function makeProxy(packed) {
    const target = [];
    const handler = {
        get(_t, prop) {
            if (prop === 'length')
                return packed.count;
            if (prop === Symbol.iterator)
                return () => iterateTuples(packed);
            if (prop === 'toJSON')
                return () => packed.serialize();
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
            if (prop === 'length' || prop === Symbol.iterator || prop === 'toJSON')
                return true;
            if (typeof prop === 'string') {
                const n = +prop;
                if (Number.isInteger(n) && String(n) === prop && n >= 0 && n < packed.count) {
                    return true;
                }
            }
            return Reflect.has(target, prop);
        },
        ownKeys(t) {
            const keys = new Array(packed.count);
            for (let i = 0; i < packed.count; i++)
                keys[i] = String(i);
            return keys.concat(Reflect.ownKeys(t));
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
            throw new TypeError('[expo-metro-config] data.map is read-only — backed by a PackedMap. ' +
                'Modify the underlying source map or rebuild with a fresh transform instead.');
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
//# sourceMappingURL=packedMap.js.map