/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Central indirection for sourcemap operations in `@expo/metro-config`
// and `@expo/cli`. Implementations are loaded lazily — `metro-source-map`
// (and its transitive `@babel/traverse`) at top level adds ~100ms to
// `@expo/cli` startup.
import type { SourceMapGeneratorOptions } from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapGenerator';
import type { Module } from '@expo/metro/metro/DeltaBundler/types';
import type {
  BabelSourceMapSegment,
  BasicSourceMap,
  FBSourceFunctionMap,
  HermesFunctionOffsets,
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
} from '@expo/metro/metro-source-map';
import type GeneratorClass from '@expo/metro/metro-source-map/Generator';

import type { ModuleSourceMap } from './jsOutput';
import { PackedMap, SENTINEL, STRIDE, isPackedWire } from './packedMap';

export type {
  BabelSourceMapSegment,
  BasicSourceMap,
  FBSourceFunctionMap,
  HermesFunctionOffsets,
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
  SourceMapGeneratorOptions,
};

// Metro's `BasicSourceMap` types `x_google_ignoreList` as `void`, which
// doesn't match the runtime data, so we define our own shape covering
// what `composeSourceMaps` actually reads and writes.
export interface ComposableSourceMap {
  version: number;
  file?: string;
  mappings: string;
  names: string[];
  sources: (string | null)[];
  sourcesContent?: (string | null)[];
  sourceRoot?: string;
  ignoreList?: number[];
  x_google_ignoreList?: number[];
  x_hermes_function_offsets?: HermesFunctionOffsets;
}

// `@jridgewell/remapping`'s CJS types use `export = function remapping(...)`,
// which TypeScript 6 rejects as a syntax error — load via `require()` and
// declare the function shape locally.
interface RemappingResult {
  version: 3;
  file?: string | null;
  mappings: string;
  names: string[];
  sources: (string | null)[];
  sourcesContent?: (string | null)[];
  sourceRoot?: string;
  ignoreList?: number[];
}

type RemappingLoader = (file: string) => unknown;
type Remapping = (input: unknown, loader: RemappingLoader) => RemappingResult;

let _remapping: Remapping | undefined;
function loadRemapping(): Remapping {
  if (!_remapping) {
    _remapping = require('@jridgewell/remapping');
  }
  return _remapping!;
}

// NOTE(@kitten): @jridgewell/gen-mapping has no streaming encoder — its
// `addSegment` buffers every segment into `_mappings` until
// `toEncodedMap` runs VLQ encoding at the end (~100 MB transient on a
// large bundle). Metro's own `Generator` is already a streaming VLQ
// encoder, so peak memory stays at roughly the size of the final
// `mappings` string. We use it directly here.

type GeneratorCtor = new () => GeneratorClass;

let _Generator: GeneratorCtor | undefined;
function loadGenerator(): GeneratorCtor {
  if (!_Generator) {
    _Generator = require('@expo/metro/metro-source-map/Generator').default;
  }
  return _Generator!;
}

// `.js` suffix required for jest's resolver to find the file under
// `@expo/metro`'s `exports` map (see `getCssDeps.ts`/`getAssets.ts` for
// the same pattern).
type IsJsModule = typeof import('@expo/metro/metro/DeltaBundler/Serializers/helpers/js').isJsModule;

let _isJsModule: IsJsModule | undefined;
function loadMetroSerializerHelpers(): { isJsModule: IsJsModule } {
  if (!_isJsModule) {
    _isJsModule = require('@expo/metro/metro/DeltaBundler/Serializers/helpers/js.js').isJsModule;
  }
  return { isJsModule: _isJsModule! };
}

function feedModuleSegments(
  generator: GeneratorClass,
  tuples: readonly MetroSourceMapSegmentTuple[],
  carryOver: number
): void {
  for (let i = 0, n = tuples.length; i < n; i++) {
    const tuple = tuples[i]!;
    const line = tuple[0] + carryOver;
    const column = tuple[1];
    if (tuple.length === 2) {
      generator.addSimpleMapping(line, column);
    } else if (tuple.length === 4) {
      generator.addSourceMapping(line, column, tuple[2], tuple[3]);
    } else {
      generator.addNamedSourceMapping(line, column, tuple[2], tuple[3], tuple[4]);
    }
  }
}

// Encoder fast path: read the `Int32Array` directly, skipping the Proxy
// and the tuple-per-segment allocation that Proxy iteration would incur.
// Without this, encoding a large bundle would allocate millions of
// transient tuples per pass — defeating the in-memory storage win.
function feedModuleSegmentsPacked(
  generator: GeneratorClass,
  packed: PackedMap,
  carryOver: number
): void {
  const buf = packed.buf;
  const names = packed.names;
  const count = packed.count;
  for (let i = 0; i < count; i++) {
    const off = i * STRIDE;
    const line = buf[off]! + carryOver;
    const column = buf[off + 1]!;
    const srcLine = buf[off + 2]!;
    if (srcLine === SENTINEL) {
      generator.addSimpleMapping(line, column);
      continue;
    }
    const srcCol = buf[off + 3]!;
    const nameIdx = buf[off + 4]!;
    if (nameIdx === SENTINEL) {
      generator.addSourceMapping(line, column, srcLine, srcCol);
    } else {
      generator.addNamedSourceMapping(line, column, srcLine, srcCol, names[nameIdx]!);
    }
  }
}

// Inlined rather than going through Metro's `getSourceMapInfo` because
// it spreads `data` and drops the non-enumerable `__packedMap`,
// silently forcing the encoder onto the slow Proxy path.
function readSourceMapInfo(
  module: Module,
  options: SourceMapGeneratorOptions
): {
  path: string;
  source: string;
  functionMap: FBSourceFunctionMap | null | undefined;
  isIgnored: boolean;
  map: ModuleSourceMap | null | undefined;
  packed: PackedMap | undefined;
  lineCount: number;
} {
  const data = getModuleJsData(module);
  // Defence in case a wire-shape `data.map` reached us without going
  // through `patchTransformFileForPackedMaps` — without this we'd miss
  // the encoder fast path AND fall through to `Array.isArray`, silently
  // emitting no segments.
  let packed = data.data.__packedMap;
  if (!packed && isPackedWire(data.data.map)) {
    packed = PackedMap.fromWire(data.data.map);
  }
  return {
    path: options.getSourceUrl?.(module) ?? module.path,
    source:
      options.excludeSource || data.type === 'js/module/asset' ? '' : module.getSource().toString(),
    functionMap: data.data.functionMap,
    isIgnored: options.shouldAddToIgnoreList(module),
    map: data.data.map,
    packed,
    lineCount: data.data.lineCount,
  };
}

function getModuleJsData(module: Module): { data: JsOutputData; type: string } {
  for (const out of module.output) {
    const type = (out as { type?: string }).type;
    if (typeof type === 'string' && type.startsWith('js/')) {
      return out as { data: JsOutputData; type: string };
    }
  }
  throw new Error(
    `[expo-metro-config] Module "${module.path}" has no JS output. Cannot build a sourcemap entry.`
  );
}

// Local shape rather than importing from `jsOutput.ts` to avoid a cycle
// through the transformer.
interface JsOutputData {
  code: string;
  lineCount: number;
  map: ModuleSourceMap | null | undefined;
  functionMap: FBSourceFunctionMap | null | undefined;
  readonly __packedMap?: PackedMap;
}

function processModuleIntoGenerator(
  generator: GeneratorClass,
  module: Module,
  options: SourceMapGeneratorOptions,
  carryOver: number
): number {
  const info = readSourceMapInfo(module, options);
  generator.startFile(info.path, info.source, info.functionMap ?? null, {
    addToIgnoreList: info.isIgnored,
  });
  if (info.packed) {
    feedModuleSegmentsPacked(generator, info.packed, carryOver);
  } else if (Array.isArray(info.map)) {
    // Legacy plain-tuple path — hits for cache entries written before
    // `data.map` switched to the wire shape, and for modules from custom
    // transformers that don't emit packed format.
    feedModuleSegments(generator, info.map, carryOver);
  }
  generator.endFile();
  return carryOver + info.lineCount;
}

function filterModules(
  modules: readonly Module[],
  processModuleFilter: SourceMapGeneratorOptions['processModuleFilter']
): Module[] {
  const { isJsModule } = loadMetroSerializerHelpers();
  const out: Module[] = [];
  for (const m of modules) {
    if (isJsModule(m) && processModuleFilter(m)) {
      out.push(m);
    }
  }
  return out;
}

// Adds `debugId`, which is emitted during JSON construction so callers
// don't pay for a parse + re-stringify roundtrip on a freshly-built
// sourcemap.
export interface ExpoSourceMapOptions extends SourceMapGeneratorOptions {
  debugId?: string;
}

// Splice `,"debugId":"..."` in front of the trailing `}` of an already
// JSON-encoded sourcemap. Used for Hermes output where we don't control
// the JSON producer.
export function appendDebugIdToSourceMap(sourceMap: string, debugId: string): string {
  return sourceMap.slice(0, -1) + `,"debugId":${JSON.stringify(debugId)}}`;
}

function emitGeneratorJson(
  generator: GeneratorClass,
  options: ExpoSourceMapOptions
): string {
  const json = generator.toString(undefined, { excludeSource: options.excludeSource });
  return options.debugId ? appendDebugIdToSourceMap(json, options.debugId) : json;
}

export function sourceMapString(modules: readonly Module[], options: ExpoSourceMapOptions): string {
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
export async function sourceMapStringNonBlocking(
  modules: readonly Module[],
  options: ExpoSourceMapOptions
): Promise<string> {
  const Generator = loadGenerator();
  const generator = new Generator();
  const filtered = filterModules(modules, options.processModuleFilter);

  const NS_IN_MS = 1_000_000;
  const SLICE_NS = 50 * NS_IN_MS;
  let carryOver = 0;
  let i = 0;

  await new Promise<void>((resolve) => {
    const tick = () => {
      const start = process.hrtime();
      while (i < filtered.length) {
        carryOver = processModuleIntoGenerator(generator, filtered[i]!, options, carryOver);
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
export function composeSourceMaps(maps: readonly ComposableSourceMap[]): ComposableSourceMap {
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
  const result: ComposableSourceMap = {
    version: composed.version,
    mappings: composed.mappings as string,
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
  const last = maps[maps.length - 1]!;
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

// Replaces the mozilla `source-map` round-trip the worker would
// otherwise do for minifier and Babel codegen sourcemaps.
type GenMappingModule = typeof import('@jridgewell/gen-mapping');
type SourceMapCodecModule = typeof import('@jridgewell/sourcemap-codec');

let _genMapping: GenMappingModule | undefined;
function loadGenMapping(): GenMappingModule {
  if (!_genMapping) {
    _genMapping = require('@jridgewell/gen-mapping');
  }
  return _genMapping!;
}

let _sourceMapCodec: SourceMapCodecModule | undefined;
function loadSourceMapCodec(): SourceMapCodecModule {
  if (!_sourceMapCodec) {
    _sourceMapCodec = require('@jridgewell/sourcemap-codec');
  }
  return _sourceMapCodec!;
}

// Matches what `metro-minify-terser` (and equivalents) accept as their
// `map` input — nullable fields from `gen-mapping.toEncodedMap` are
// normalized away.
export interface EncodedTransformerSourceMap {
  version: 3;
  file?: string;
  mappings: string;
  names: string[];
  sources: string[];
  sourcesContent?: (string | null)[];
}

// Convert a Metro-style tuple array (single source) to an encoded
// sourcemap suitable for feeding into a minifier.
// `MetroSourceMapSegmentTuple` lines are 1-based; `gen-mapping`'s
// `addSegment` is 0-based — subtract 1 at this boundary.
export function tuplesToEncodedMap(opts: {
  filename: string;
  source: string;
  tuples: readonly MetroSourceMapSegmentTuple[];
}): EncodedTransformerSourceMap {
  const { GenMapping, addSegment, setSourceContent, toEncodedMap } = loadGenMapping();
  const map = new GenMapping({ file: opts.filename });
  setSourceContent(map, opts.filename, opts.source);

  for (const tuple of opts.tuples) {
    const genLine = tuple[0] - 1;
    const genCol = tuple[1];
    if (tuple.length === 2) {
      addSegment(map, genLine, genCol);
    } else if (tuple.length === 4) {
      addSegment(map, genLine, genCol, opts.filename, tuple[2] - 1, tuple[3]);
    } else {
      addSegment(map, genLine, genCol, opts.filename, tuple[2] - 1, tuple[3], tuple[4]);
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
    names: encoded.names as string[],
    sources: [opts.filename],
    sourcesContent: encoded.sourcesContent as (string | null)[] | undefined,
  };
}

// Convert an encoded sourcemap (from a minifier, etc.) back to Metro's
// tuple representation. `sourcemap-codec.decode` returns 0-based outer
// indices and 0-based source lines; Metro tuples are 1-based for both —
// add 1 at this boundary. The per-segment source identity is dropped:
// Metro tuples are per-module so the source is implicit.
//
// The segment arrays returned by `decode` already have the same length
// as the corresponding metro tuple (1, 4, or 5), so we re-use them in
// place rather than allocating fresh tuples.
export function decodedMapToTuples(input: {
  mappings: string;
  names: readonly string[];
}): MetroSourceMapSegmentTuple[] {
  const { decode } = loadSourceMapCodec();
  const decoded = decode(input.mappings);
  const tuples: MetroSourceMapSegmentTuple[] = [];

  for (let lineIdx = 0; lineIdx < decoded.length; lineIdx++) {
    const line = decoded[lineIdx]!;
    const genLine = lineIdx + 1;
    for (const seg of line) {
      // Source layout: `[genCol]`, `[genCol, srcIdx, srcLine0, srcCol]`,
      // or `[genCol, srcIdx, srcLine0, srcCol, nameIdx]`. Rewrite in
      // place to `[genLine, genCol, srcLine, srcCol, name?]`.
      const segMut = seg as unknown as (number | string)[];
      if (segMut.length === 1) {
        segMut[1] = segMut[0]!;
        segMut[0] = genLine;
      } else {
        const genCol = segMut[0] as number;
        segMut[0] = genLine;
        segMut[1] = genCol;
        segMut[2] = (segMut[2] as number) + 1;
        if (segMut.length === 5) {
          segMut[4] = input.names[segMut[4] as number]!;
        }
      }
      tuples.push(segMut as unknown as MetroSourceMapSegmentTuple);
    }
  }

  return tuples;
}

// Convert Babel's `result.rawMappings` to Metro tuples. Pure shape
// transformation — no encode/decode round-trip needed.
export function rawMappingsToTuples(
  rawMappings: readonly BabelSourceMapSegment[]
): MetroSourceMapSegmentTuple[] {
  const tuples: MetroSourceMapSegmentTuple[] = [];
  for (const m of rawMappings) {
    const genLine = m.generated.line;
    const genCol = m.generated.column;
    if (m.original == null) {
      tuples.push([genLine, genCol]);
    } else if (typeof m.name !== 'string') {
      tuples.push([genLine, genCol, m.original.line, m.original.column]);
    } else {
      tuples.push([genLine, genCol, m.original.line, m.original.column, m.name]);
    }
  }
  return tuples;
}
