/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { SourceMapGeneratorOptions } from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapGenerator';
import type { Module } from '@expo/metro/metro/DeltaBundler/types';
import type { BabelSourceMapSegment, BasicSourceMap, FBSourceFunctionMap, HermesFunctionOffsets, MetroSourceMapSegmentTuple, MixedSourceMap } from '@expo/metro/metro-source-map';
export type { BabelSourceMapSegment, BasicSourceMap, FBSourceFunctionMap, HermesFunctionOffsets, MetroSourceMapSegmentTuple, MixedSourceMap, SourceMapGeneratorOptions, };
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
export interface ExpoSourceMapOptions extends SourceMapGeneratorOptions {
    debugId?: string;
}
export declare function appendDebugIdToSourceMap(sourceMap: string, debugId: string): string;
export declare function sourceMapString(modules: readonly Module[], options: ExpoSourceMapOptions): string;
export declare function sourceMapStringNonBlocking(modules: readonly Module[], options: ExpoSourceMapOptions): Promise<string>;
export declare function patchMetroSourceMapStringForPackedMaps(): void;
export declare function composeSourceMaps(maps: readonly ComposableSourceMap[]): ComposableSourceMap;
export interface EncodedTransformerSourceMap {
    version: 3;
    file?: string;
    mappings: string;
    names: string[];
    sources: string[];
    sourcesContent?: (string | null)[];
}
export declare function rawMappingsToEncodedMap(opts: {
    filename: string;
    source: string;
    rawMappings: readonly BabelSourceMapSegment[];
}): EncodedTransformerSourceMap;
