"use strict";
/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendDebugIdToSourceMap = appendDebugIdToSourceMap;
exports.sourceMapString = sourceMapString;
exports.sourceMapStringNonBlocking = sourceMapStringNonBlocking;
exports.patchMetroSourceMapStringForPackedMaps = patchMetroSourceMapStringForPackedMaps;
exports.composeSourceMaps = composeSourceMaps;
exports.rawMappingsToEncodedMap = rawMappingsToEncodedMap;
const packedMap_1 = require("./packedMap");
let _remapping;
function loadRemapping() {
    if (!_remapping) {
        _remapping = require('@jridgewell/remapping');
    }
    return _remapping;
}
let _Generator;
function loadGenerator() {
    if (!_Generator) {
        _Generator = require('@expo/metro/metro-source-map/Generator').default;
    }
    return _Generator;
}
let _isJsModule;
function loadMetroSerializerHelpers() {
    if (!_isJsModule) {
        _isJsModule = require('@expo/metro/metro/DeltaBundler/Serializers/helpers/js.js').isJsModule;
    }
    return { isJsModule: _isJsModule };
}
function feedModuleSegments(generator, tuples, carryOver) {
    for (let i = 0, n = tuples.length; i < n; i++) {
        const tuple = tuples[i];
        const line = tuple[0] + carryOver;
        const column = tuple[1];
        if (tuple.length === 2) {
            generator.addSimpleMapping(line, column);
        }
        else if (tuple.length === 4) {
            generator.addSourceMapping(line, column, tuple[2], tuple[3]);
        }
        else {
            generator.addNamedSourceMapping(line, column, tuple[2], tuple[3], tuple[4]);
        }
    }
}
// Encoder fast path: read the `Int32Array` directly, skipping the Proxy
// and the tuple-per-segment allocation that Proxy iteration would incur.
// Without this, encoding a large bundle would allocate millions of
// transient tuples per pass — defeating the in-memory storage win.
function feedModuleSegmentsPacked(generator, packed, carryOver) {
    const buf = packed.buf;
    const names = packed.names;
    const count = packed.count;
    for (let i = 0; i < count; i++) {
        const off = i * packedMap_1.STRIDE;
        const line = buf[off] + carryOver;
        const column = buf[off + 1];
        const srcLine = buf[off + 2];
        if (srcLine === packedMap_1.SENTINEL) {
            generator.addSimpleMapping(line, column);
            continue;
        }
        const srcCol = buf[off + 3];
        const nameIdx = buf[off + 4];
        if (nameIdx === packedMap_1.SENTINEL) {
            generator.addSourceMapping(line, column, srcLine, srcCol);
        }
        else {
            generator.addNamedSourceMapping(line, column, srcLine, srcCol, names[nameIdx]);
        }
    }
}
// Inlined rather than going through Metro's `getSourceMapInfo` because
// it spreads `data` and drops the non-enumerable `__packedMap`,
// silently forcing the encoder onto the slow Proxy path.
function readSourceMapInfo(module, options) {
    const data = getModuleJsData(module);
    // Don't read `data.map` when `__packedMap` is set — `data.map` is a
    // lazy accessor that materializes the Proxy on first read, and the
    // fast path below doesn't need it.
    let packed = data.data.__packedMap;
    let map;
    if (!packed) {
        map = data.data.map;
        // Self-heal a `SerializableSourceMap` `data.map` that bypassed the wrapper.
        if ((0, packedMap_1.isSerializableSourceMap)(map)) {
            packed = packedMap_1.PackedMap.deserialize(map);
            map = undefined;
        }
    }
    return {
        path: options.getSourceUrl?.(module) ?? module.path,
        source: options.excludeSource || data.type === 'js/module/asset' ? '' : module.getSource().toString(),
        functionMap: data.data.functionMap,
        isIgnored: options.shouldAddToIgnoreList(module),
        map,
        packed,
        lineCount: data.data.lineCount,
    };
}
function getModuleJsData(module) {
    for (const out of module.output) {
        const type = out.type;
        if (typeof type === 'string' && type.startsWith('js/')) {
            return out;
        }
    }
    throw new Error(`[expo-metro-config] Module "${module.path}" has no JS output. Cannot build a sourcemap entry.`);
}
function processModuleIntoGenerator(generator, module, options, carryOver) {
    const info = readSourceMapInfo(module, options);
    generator.startFile(info.path, info.source, info.functionMap ?? null, {
        addToIgnoreList: info.isIgnored,
    });
    if (info.packed) {
        feedModuleSegmentsPacked(generator, info.packed, carryOver);
    }
    else if (Array.isArray(info.map)) {
        // Legacy plain-tuple path — hits for cache entries written before
        // `data.map` switched to `SerializableSourceMap`, and for modules from custom
        // transformers that don't emit packed format.
        feedModuleSegments(generator, info.map, carryOver);
    }
    generator.endFile();
    return carryOver + info.lineCount;
}
function filterModules(modules, processModuleFilter) {
    const { isJsModule } = loadMetroSerializerHelpers();
    const out = [];
    for (const m of modules) {
        if (isJsModule(m) && processModuleFilter(m)) {
            out.push(m);
        }
    }
    return out;
}
// Splice `,"debugId":"..."` in front of the trailing `}` of an already
// JSON-encoded sourcemap. Used for Hermes output where we don't control
// the JSON producer.
function appendDebugIdToSourceMap(sourceMap, debugId) {
    return sourceMap.slice(0, -1) + `,"debugId":${JSON.stringify(debugId)}}`;
}
function emitGeneratorJson(generator, options) {
    const json = generator.toString(undefined, { excludeSource: options.excludeSource });
    return options.debugId ? appendDebugIdToSourceMap(json, options.debugId) : json;
}
function sourceMapString(modules, options) {
    const Generator = loadGenerator();
    const generator = new Generator();
    const filtered = filterModules(modules, options.processModuleFilter);
    let carryOver = 0;
    for (const mod of filtered) {
        carryOver = processModuleIntoGenerator(generator, mod, options, carryOver);
    }
    return emitGeneratorJson(generator, options);
}
// Yields back to the event loop every ~50 ms so the node server stays
// responsive on very large bundles. Matches Metro's `getSourceMapInfosImpl`
// pacing.
async function sourceMapStringNonBlocking(modules, options) {
    const Generator = loadGenerator();
    const generator = new Generator();
    const filtered = filterModules(modules, options.processModuleFilter);
    const NS_IN_MS = 1_000_000;
    const SLICE_NS = 50 * NS_IN_MS;
    let carryOver = 0;
    let i = 0;
    await new Promise((resolve) => {
        const tick = () => {
            const start = process.hrtime();
            while (i < filtered.length) {
                carryOver = processModuleIntoGenerator(generator, filtered[i], options, carryOver);
                i++;
                const diff = process.hrtime(start);
                if (diff[1] > SLICE_NS || diff[0] > 0) {
                    setImmediate(tick);
                    return;
                }
            }
            resolve();
        };
        tick();
    });
    return emitGeneratorJson(generator, options);
}
// Metro's `Server._processSourceMapRequest` calls
// `sourceMapStringNonBlocking` directly, bypassing the `customSerializer`
// chain — so without rerouting it, every dev `.map` fetch iterates the
// `data.map` Proxy and the encoder fast path is unreachable.
function patchMetroSourceMapStringForPackedMaps() {
    const stock = require('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString');
    stock.sourceMapString = sourceMapString;
    stock.sourceMapStringNonBlocking = sourceMapStringNonBlocking;
}
// `maps[0]` is the original-most transform; `maps[maps.length - 1]` is
// the most recent. Built on `@jridgewell/remapping` instead of mozilla's
// `SourceMapConsumer`-based composer.
//
// Two shims around remapping:
//   - Translate `x_google_ignoreList` to the standard `ignoreList` on
//     each input. Metro's `Generator` emits only the legacy alias, but
//     remapping's `TraceMap` reads only the standard field, so without
//     this ignore-list info disappears across compose.
//   - Carry over `x_hermes_function_offsets` (load-bearing for Hermes
//     bytecode-frame symbolication) and re-emit the legacy
//     `x_google_ignoreList` alias for devtools that haven't yet picked up
//     the rename.
//
// `x_facebook_sources` is deliberately dropped — Expo doesn't ship to FB
// symbolicators.
function composeSourceMaps(maps) {
    if (maps.length < 1) {
        throw new Error('composeSourceMaps: Expected at least one map');
    }
    const normalized = maps.map((map) => {
        if (map.ignoreList || !map.x_google_ignoreList) {
            return map;
        }
        return { ...map, ignoreList: map.x_google_ignoreList };
    });
    // Metro convention is original-first; remapping is most-recent first.
    const reversed = normalized.slice().reverse();
    const composed = loadRemapping()(reversed, () => null);
    // Re-emit as a plain object — remapping returns a `SourceMap` class
    // instance, which doesn't round-trip JSON cleanly.
    const result = {
        version: composed.version,
        mappings: composed.mappings,
        names: composed.names,
        sources: composed.sources,
    };
    if (composed.file != null) {
        result.file = composed.file;
    }
    if (composed.sourceRoot != null) {
        result.sourceRoot = composed.sourceRoot;
    }
    if (composed.sourcesContent) {
        result.sourcesContent = composed.sourcesContent;
    }
    // Required by Hermes for bytecode-frame symbolication. Lives on the
    // most-recent map (the Hermes map) and passes through unchanged.
    const last = maps[maps.length - 1];
    if (last.x_hermes_function_offsets) {
        result.x_hermes_function_offsets = last.x_hermes_function_offsets;
    }
    // Emit both standard and legacy keys so devtools either side of the
    // rename keep working.
    if (composed.ignoreList && composed.ignoreList.length > 0) {
        result.ignoreList = composed.ignoreList;
        result.x_google_ignoreList = composed.ignoreList;
    }
    return result;
}
let _genMapping;
function loadGenMapping() {
    if (!_genMapping) {
        _genMapping = require('@jridgewell/gen-mapping');
    }
    return _genMapping;
}
// Convert Babel's `result.rawMappings` directly to an encoded sourcemap
// for feeding into a minifier. `BabelSourceMapSegment` lines are
// 1-based; `gen-mapping`'s `addSegment` is 0-based — subtract 1 at the
// boundary. Skipping a tuple intermediate avoids one Array allocation
// per segment.
function rawMappingsToEncodedMap(opts) {
    const { GenMapping, addSegment, setSourceContent, toEncodedMap } = loadGenMapping();
    const map = new GenMapping({ file: opts.filename });
    setSourceContent(map, opts.filename, opts.source);
    for (const m of opts.rawMappings) {
        const genLine = m.generated.line - 1;
        const genCol = m.generated.column;
        if (m.original == null) {
            addSegment(map, genLine, genCol);
        }
        else if (typeof m.name !== 'string') {
            addSegment(map, genLine, genCol, opts.filename, m.original.line - 1, m.original.column);
        }
        else {
            addSegment(map, genLine, genCol, opts.filename, m.original.line - 1, m.original.column, m.name);
        }
    }
    const encoded = toEncodedMap(map);
    // gen-mapping always registers `opts.filename` as the single source, so
    // hard-coding avoids a `.map(...)` allocation and a `(string | null)[]`
    // narrowing.
    return {
        version: encoded.version,
        file: encoded.file ?? undefined,
        mappings: encoded.mappings,
        names: encoded.names,
        sources: [opts.filename],
        sourcesContent: encoded.sourcesContent,
    };
}
//# sourceMappingURL=sourceMap.js.map