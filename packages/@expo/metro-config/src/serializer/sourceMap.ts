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
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
} from '@expo/metro/metro-source-map';

export type {
  BabelSourceMapSegment,
  BasicSourceMap,
  FBSourceFunctionMap,
  MetroSourceMapSegmentTuple,
  MixedSourceMap,
  SourceMapGeneratorOptions,
};

type SourceMapStringModule =
  typeof import('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString');
type MetroSourceMapModule = typeof import('@expo/metro/metro-source-map');

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

export function getComposeSourceMaps(): MetroSourceMapModule['composeSourceMaps'] {
  return loadMetroSourceMap().composeSourceMaps;
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
