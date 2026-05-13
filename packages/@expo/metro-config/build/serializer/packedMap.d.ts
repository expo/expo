/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { BabelSourceMapSegment, MetroSourceMapSegmentTuple } from '@expo/metro/metro-source-map';
export declare const STRIDE = 5;
export declare const SENTINEL = -1;
export interface SerializableSourceMap {
    __packed: number[];
    __names: string[];
    __count: number;
    __version: 1;
}
export declare function isSerializableSourceMap(x: unknown): x is SerializableSourceMap;
export declare class PackedMap {
    readonly count: number;
    readonly names: string[];
    readonly buf: Int32Array;
    private constructor();
    static deserialize(input: SerializableSourceMap): PackedMap;
    static fromInts(buf: Int32Array, names: string[], count: number): PackedMap;
    serialize(): SerializableSourceMap;
}
export declare function tupleAt(p: PackedMap, i: number): MetroSourceMapSegmentTuple | undefined;
export declare function installPackedMap(data: {
    map?: unknown;
    __packedMap?: PackedMap;
}, source: SerializableSourceMap | readonly MetroSourceMapSegmentTuple[]): void;
export declare function wrapTransformResultMaps<T extends {
    output?: readonly unknown[] | null;
}>(result: T): T;
export declare function patchTransformFileForPackedMaps(bundler: {
    transformFile: (...args: any[]) => Promise<unknown>;
}): void;
export declare function materializeMap(map: SerializableSourceMap | readonly MetroSourceMapSegmentTuple[] | null | undefined): MetroSourceMapSegmentTuple[];
export declare function emptySourceMap(): SerializableSourceMap;
export declare function packRawMappings(rawMappings: readonly BabelSourceMapSegment[]): SerializableSourceMap;
export declare function packDecodedMappings(input: {
    mappings: string;
    names: readonly string[];
}): SerializableSourceMap;
export declare function countLinesAndTerminateSourceMap(code: string, sourceMap: SerializableSourceMap): {
    lineCount: number;
    sourceMap: SerializableSourceMap;
};
export declare function makeProxy(packed: PackedMap): MetroSourceMapSegmentTuple[];
