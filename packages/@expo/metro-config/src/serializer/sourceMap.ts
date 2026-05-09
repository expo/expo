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
import type {
  BabelSourceMapSegment,
  BasicSourceMap,
  FBSourceFunctionMap,
  HermesFunctionOffsets,
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
} from '@expo/metro/metro-source-map';

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

type SourceMapStringModule =
  typeof import('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString');
type MetroSourceMapModule = typeof import('@expo/metro/metro-source-map');

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

let _sourceMapStringModule: SourceMapStringModule | undefined;
function loadSourceMapStringModule(): SourceMapStringModule {
  if (!_sourceMapStringModule) {
    _sourceMapStringModule = require('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString');
  }
  return _sourceMapStringModule!;
}

let _metroSourceMap: MetroSourceMapModule | undefined;
function loadMetroSourceMap(): MetroSourceMapModule {
  if (!_metroSourceMap) {
    _metroSourceMap = require('@expo/metro/metro-source-map');
  }
  return _metroSourceMap!;
}

export function getSourceMapString(): SourceMapStringModule['sourceMapString'] {
  return loadSourceMapStringModule().sourceMapString;
}

export function getSourceMapStringNonBlocking(): SourceMapStringModule['sourceMapStringNonBlocking'] {
  return loadSourceMapStringModule().sourceMapStringNonBlocking;
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

export function getFromRawMappings(): MetroSourceMapModule['fromRawMappings'] {
  return loadMetroSourceMap().fromRawMappings;
}

export function getToBabelSegments(): MetroSourceMapModule['toBabelSegments'] {
  return loadMetroSourceMap().toBabelSegments;
}

export function getToSegmentTuple(): MetroSourceMapModule['toSegmentTuple'] {
  return loadMetroSourceMap().toSegmentTuple;
}
