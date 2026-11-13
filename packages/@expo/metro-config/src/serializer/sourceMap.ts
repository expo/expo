/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  BabelDecodedMap,
  BabelSourceMapSegment,
  BasicSourceMap,
  FBSourceFunctionMap,
  HermesFunctionOffsets,
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
  VlqMap,
} from '@expo/metro/metro-source-map';
// Central indirection for sourcemap operations in `@expo/metro-config`
// and `@expo/cli`. Implementations are loaded lazily — `metro-source-map`
// (and its transitive `@babel/traverse`) at top level adds ~100ms to
// `@expo/cli` startup.
import type { SourceMapGeneratorOptions } from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapGenerator';
import type { Module } from '@expo/metro/metro/DeltaBundler/types';

export type {
  BabelDecodedMap,
  BabelSourceMapSegment,
  BasicSourceMap,
  FBSourceFunctionMap,
  HermesFunctionOffsets,
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
  SourceMapGeneratorOptions,
  VlqMap,
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

let _sourcemapCodec: typeof import('@jridgewell/sourcemap-codec') | undefined;
function loadSourcemapCodec(): typeof import('@jridgewell/sourcemap-codec') {
  if (!_sourcemapCodec) {
    _sourcemapCodec = require('@jridgewell/sourcemap-codec');
  }
  return _sourcemapCodec!;
}

type MetroSourceMapModule = typeof import('@expo/metro/metro-source-map');

let _metroSourceMap: MetroSourceMapModule | undefined;
function loadMetroSourceMap(): MetroSourceMapModule {
  if (!_metroSourceMap) {
    _metroSourceMap = require('@expo/metro/metro-source-map');
  }
  return _metroSourceMap!;
}

type MetroSourceMapStringModule =
  typeof import('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString');

let _metroSourceMapString: MetroSourceMapStringModule | undefined;
function loadMetroSourceMapString(): MetroSourceMapStringModule {
  if (!_metroSourceMapString) {
    _metroSourceMapString = require('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString');
  }
  return _metroSourceMapString!;
}

type TraceMappingModule = typeof import('@jridgewell/trace-mapping');

let _traceMapping: TraceMappingModule | undefined;
function loadTraceMapping(): TraceMappingModule {
  if (!_traceMapping) {
    _traceMapping = require('@jridgewell/trace-mapping');
  }
  return _traceMapping!;
}

/** An indexed source map, as Metro emits for bundles */
export interface IndexedSourceMap {
  version: number;
  file?: string;
  sections: {
    offset: { line: number; column: number };
    map: ComposableSourceMap | IndexedSourceMap;
  }[];
}

/**
 * Flattens an indexed source map into a single `mappings` string, and returns a flat map unchanged.
 * Metro emits indexed bundle maps, but some consumers (like `@jridgewell/remapping`) only accept
 * flat ones.
 */
export function flattenSourceMap(map: ComposableSourceMap | IndexedSourceMap): ComposableSourceMap {
  if (!('sections' in map)) {
    return map;
  }
  const { FlattenMap, encodedMap } = loadTraceMapping();
  const flat = encodedMap(
    new FlattenMap(map as unknown as ConstructorParameters<typeof FlattenMap>[0])
  );
  const result: ComposableSourceMap = {
    version: flat.version,
    mappings: flat.mappings,
    names: flat.names,
    sources: flat.sources,
  };
  if (flat.file != null) {
    result.file = flat.file;
  }
  if (flat.sourcesContent) {
    result.sourcesContent = flat.sourcesContent;
  }
  if (flat.ignoreList && flat.ignoreList.length > 0) {
    result.ignoreList = flat.ignoreList;
  }
  return result;
}

/** An encoded source map's `mappings` and `names`, such as a minifier's output */
export interface EncodedMappings {
  mappings: string;
  names: readonly string[];
}

const NEWLINE = /\r\n?|\n|\u2028|\u2029/g;

function countLinesAndLastLineColumn(code: string): { lineCount: number; lastLineColumn: number } {
  let lineCount = 1;
  let lastLineStart = 0;
  for (const match of code.matchAll(NEWLINE)) {
    lineCount++;
    lastLineStart = match.index! + match[0].length;
  }
  return { lineCount, lastLineColumn: code.length - lastLineStart };
}

/**
 * Encodes a module's compact `VlqMap` from Babel's `decodedMap`. Like Metro's transform worker,
 * a generated-only mapping terminates the map one past the last column of `code`, so
 * out-of-bounds lookups resolve to nothing rather than aliasing the last real mapping.
 */
export function vlqMapFromDecodedMap(
  decodedMap: BabelDecodedMap | null | undefined,
  code: string
): { lineCount: number; map: VlqMap } {
  const { lineCount, lastLineColumn } = countLinesAndLastLineColumn(code);
  const map = loadMetroSourceMap().vlqMapFromBabelDecodedMap(
    decodedMap ?? { mappings: [], names: [] },
    [lineCount, lastLineColumn]
  );
  return { lineCount, map };
}

/** Encodes a module's compact `VlqMap` from an encoded source map, such as a minifier's output. */
export function vlqMapFromEncodedMap(
  encoded: EncodedMappings,
  code: string
): { lineCount: number; map: VlqMap } {
  const mappings = loadSourcemapCodec().decode(encoded.mappings) as BabelDecodedMap['mappings'];
  return vlqMapFromDecodedMap({ mappings, names: encoded.names }, code);
}

// Adds `debugId`, which is spliced into the serialized map so callers
// don't pay for a parse + re-stringify roundtrip on a freshly-built
// sourcemap.
export interface ExpoSourceMapOptions extends SourceMapGeneratorOptions {
  debugId?: string;
}

// Splice `,"debugId":"..."` in front of the trailing `}` of an already
// JSON-encoded sourcemap. Also used for Hermes output where we don't control
// the JSON producer.
export function appendDebugIdToSourceMap(sourceMap: string, debugId: string): string {
  return sourceMap.slice(0, -1) + `,"debugId":${JSON.stringify(debugId)}}`;
}

export function sourceMapString(modules: readonly Module[], options: ExpoSourceMapOptions): string {
  const { debugId, ...generatorOptions } = options;
  const json = loadMetroSourceMapString().sourceMapString(modules, generatorOptions);
  return debugId ? appendDebugIdToSourceMap(json, debugId) : json;
}

export async function sourceMapStringNonBlocking(
  modules: readonly Module[],
  options: ExpoSourceMapOptions
): Promise<string> {
  const { debugId, ...generatorOptions } = options;
  const json = await loadMetroSourceMapString().sourceMapStringNonBlocking(
    modules,
    generatorOptions
  );
  return debugId ? appendDebugIdToSourceMap(json, debugId) : json;
}

function repairInvalidNegativeIndices(map: ComposableSourceMap): ComposableSourceMap {
  const { decode, encode } = loadSourcemapCodec();
  const decoded = decode(map.mappings);

  let changed = false;
  for (const line of decoded) {
    for (let i = 0; i < line.length; i++) {
      const segment = line[i];
      // A `[genCol, srcIdx, srcLine, ...]` segment crashes `trace-mapping`
      // when either the source index or the source line is negative
      // (Hermes' no-location sentinel)
      if (segment != null && segment.length > 1 && (segment[1]! < 0 || segment[2]! < 0)) {
        line[i] = [segment[0]!];
        changed = true;
      }
    }
  }
  return changed ? { ...map, mappings: encode(decoded) } : map;
}

// `maps[0]` is the original-most transform; `maps[maps.length - 1]` is
// the most recent. Indexed inputs (like Metro's bundle maps) are flattened first. Built on `@jridgewell/remapping` instead of mozilla's
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
export function composeSourceMaps(
  maps: readonly (ComposableSourceMap | IndexedSourceMap)[]
): ComposableSourceMap {
  if (maps.length < 1) {
    throw new Error('composeSourceMaps: Expected at least one map');
  }

  const normalized = maps.map((input) => {
    const map = flattenSourceMap(input);
    if (map.ignoreList || !map.x_google_ignoreList) {
      return map;
    }
    return { ...map, ignoreList: map.x_google_ignoreList };
  });

  // Metro convention is original-first; remapping is most-recent first.
  let input = normalized.slice().reverse();
  const remap = loadRemapping();

  let composed: RemappingResult;

  try {
    composed = remap(input, () => null);
  } catch (error) {
    // `@jridgewell/trace-mapping` (through `@jridgewell/remapping`) crashes
    // on any mapping where original line/column is negative. Hermes may emit
    // such segments and we should gracefully recover from this on a crash.
    // See:
    // - https://github.com/jridgewell/sourcemaps/issues/54
    // - https://github.com/expo/expo/issues/46843
    let didRepair = false;
    try {
      input = input.map((map) => {
        const fixed = repairInvalidNegativeIndices(map);
        didRepair ||= fixed !== map;
        return fixed;
      });
    } catch {
      throw error;
    }
    if (!didRepair) {
      throw error;
    } else {
      composed = remap(input, () => null);
    }
  }

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
  const last = normalized[normalized.length - 1]!;
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
// otherwise do for the encoded sourcemap fed into a minifier.
type GenMappingModule = typeof import('@jridgewell/gen-mapping');

let _genMapping: GenMappingModule | undefined;
function loadGenMapping(): GenMappingModule {
  if (!_genMapping) {
    _genMapping = require('@jridgewell/gen-mapping');
  }
  return _genMapping!;
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

// Convert Babel's `result.rawMappings` directly to an encoded sourcemap
// for feeding into a minifier. `BabelSourceMapSegment` lines are
// 1-based; `gen-mapping`'s `addSegment` is 0-based — subtract 1 at the
// boundary. Skipping a tuple intermediate avoids one Array allocation
// per segment.
export function rawMappingsToEncodedMap(opts: {
  filename: string;
  source: string;
  rawMappings: readonly BabelSourceMapSegment[];
}): EncodedTransformerSourceMap {
  const { GenMapping, addSegment, setSourceContent, toEncodedMap } = loadGenMapping();
  const map = new GenMapping({ file: opts.filename });
  setSourceContent(map, opts.filename, opts.source);

  for (const m of opts.rawMappings) {
    const genLine = m.generated.line - 1;
    const genCol = m.generated.column;
    if (m.original == null) {
      addSegment(map, genLine, genCol);
    } else if (typeof m.name !== 'string') {
      addSegment(map, genLine, genCol, opts.filename, m.original.line - 1, m.original.column);
    } else {
      addSegment(
        map,
        genLine,
        genCol,
        opts.filename,
        m.original.line - 1,
        m.original.column,
        m.name
      );
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
