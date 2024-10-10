// #region metro-source-map
declare module 'metro-source-map' {
  export * from 'metro-source-map/src/source-map';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/B64Builder.js
declare module 'metro-source-map/src/B64Builder' {
  /**
   * Efficient builder for base64 VLQ mappings strings.
   *
   * This class uses a buffer that is preallocated with one megabyte and is
   * reallocated dynamically as needed, doubling its size.
   *
   * Encoding never creates any complex value types (strings, objects), and only
   * writes character values to the buffer.
   *
   * For details about source map terminology and specification, check
   * https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit
   */
  class B64Builder {
    buffer: Buffer;
    pos: number;
    hasSegment: boolean;
    constructor();
    markLines(n: number): this;
    startSegment(column: number): this;
    append(value: number): this;
    toString(): string;
    _writeByte(byte: number): void;
    _realloc(): void;
  }
  export default B64Builder;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/BundleBuilder.js
declare module 'metro-source-map/src/BundleBuilder' {
  import type { IndexMap, IndexMapSection, MixedSourceMap } from 'metro-source-map/src/source-map';
  export class BundleBuilder {
    _file: string;
    _sections: IndexMapSection[];
    _line: number;
    _column: number;
    _code: string;
    _afterMappedContent: boolean;
    constructor(file: string);
    _pushMapSection(map: MixedSourceMap): void;
    _endMappedContent(): void;
    append(code: string, map: null | undefined | MixedSourceMap): this;
    getMap(): MixedSourceMap;
    getCode(): string;
  }
  export function createIndexMap(file: string, sections: IndexMapSection[]): IndexMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/composeSourceMaps.js
declare module 'metro-source-map/src/composeSourceMaps' {
  import type { MixedSourceMap } from 'metro-source-map/src/source-map';
  function composeSourceMaps(maps: readonly MixedSourceMap[]): MixedSourceMap;
  export default composeSourceMaps;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/AbstractConsumer.js
declare module 'metro-source-map/src/Consumer/AbstractConsumer' {
  import type {
    GeneratedPositionLookup,
    IConsumer,
    IterationOrder,
    Mapping,
    SourcePosition,
  } from 'metro-source-map/src/Consumer/types.flow';
  class AbstractConsumer implements IConsumer {
    _sourceMap: {
      readonly file?: string;
    };
    constructor(sourceMap: { readonly file?: string });
    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    generatedMappings(): Iterable<Mapping>;
    eachMapping(callback: (mapping: Mapping) => any, context?: any, order?: IterationOrder): void;
    get file(): null | undefined | string;
    sourceContentFor(source: string, nullOnMissing: true): null | undefined | string;
  }
  export default AbstractConsumer;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/constants.js
declare module 'metro-source-map/src/Consumer/constants' {
  import type { Number0, Number1 } from 'ob1';
  export type IterationOrder = unknown;
  export type LookupBias = unknown;
  export const FIRST_COLUMN: Number0;
  export const FIRST_LINE: Number1;
  export const GENERATED_ORDER: IterationOrder;
  export const ORIGINAL_ORDER: IterationOrder;
  export const GREATEST_LOWER_BOUND: LookupBias;
  export const LEAST_UPPER_BOUND: LookupBias;
  export const EMPTY_POSITION: any;
  export function iterationOrderToString(x: IterationOrder): string;
  export function lookupBiasToString(x: LookupBias): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/createConsumer.js
declare module 'metro-source-map/src/Consumer/createConsumer' {
  import type { MixedSourceMap } from 'metro-source-map/src/source-map';
  import type { IConsumer } from 'metro-source-map/src/Consumer/types.flow';
  function createConsumer(sourceMap: MixedSourceMap): IConsumer;
  export default createConsumer;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/DelegatingConsumer.js
declare module 'metro-source-map/src/Consumer/DelegatingConsumer' {
  import type { MixedSourceMap } from 'metro-source-map/src/source-map';
  import type { LookupBias } from 'metro-source-map/src/Consumer/constants';
  import type {
    GeneratedPositionLookup,
    IConsumer,
    IterationOrder,
    Mapping,
    SourcePosition,
  } from 'metro-source-map/src/Consumer/types.flow';
  /**
   * A source map consumer that supports both "basic" and "indexed" source maps.
   * Uses `MappingsConsumer` and `SectionsConsumer` under the hood (via
   * `createConsumer`).
   */
  class DelegatingConsumer implements IConsumer {
    static readonly GENERATED_ORDER: IterationOrder;
    static readonly ORIGINAL_ORDER: IterationOrder;
    static readonly GREATEST_LOWER_BOUND: LookupBias;
    static readonly LEAST_UPPER_BOUND: LookupBias;
    _rootConsumer: IConsumer;
    constructor(sourceMap: MixedSourceMap);
    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    generatedMappings(): Iterable<Mapping>;
    eachMapping(callback: (mapping: Mapping) => any, context?: any, order?: IterationOrder): void;
    get file(): null | undefined | string;
    sourceContentFor(source: string, nullOnMissing: true): null | undefined | string;
  }
  export default DelegatingConsumer;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/index.js
declare module 'metro-source-map/src/Consumer/index' {
  export { default as DelegatingConsumer } from 'metro-source-map/src/Consumer/DelegatingConsumer';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/MappingsConsumer.js
declare module 'metro-source-map/src/Consumer/MappingsConsumer' {
  import type { BasicSourceMap } from 'metro-source-map/src/source-map';
  import type {
    GeneratedPositionLookup,
    IConsumer,
    Mapping,
    SourcePosition,
  } from 'metro-source-map/src/Consumer/types.flow';
  import type { Number0 } from 'ob1';
  import AbstractConsumer from 'metro-source-map/src/Consumer/AbstractConsumer';
  /**
   * A source map consumer that supports "basic" source maps (that have a
   * `mappings` field and no sections).
   */
  class MappingsConsumer extends AbstractConsumer implements IConsumer {
    _sourceMap: BasicSourceMap;
    _decodedMappings: null | undefined | readonly Mapping[];
    _normalizedSources: null | undefined | readonly string[];
    constructor(sourceMap: BasicSourceMap);
    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    _decodeMappings(): Generator<Mapping, void, void>;
    _normalizeAndCacheSources(): readonly string[];
    _decodeAndCacheMappings(): readonly Mapping[];
    generatedMappings(): Iterable<Mapping>;
    _indexOfSource(source: string): null | undefined | Number0;
    sourceContentFor(source: string, nullOnMissing: true): null | undefined | string;
  }
  export default MappingsConsumer;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/normalizeSourcePath.js
declare module 'metro-source-map/src/Consumer/normalizeSourcePath' {
  function normalizeSourcePath(
    sourceInput: string,
    map: {
      readonly sourceRoot?: null | undefined | string;
    }
  ): string;
  export default normalizeSourcePath;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/positionMath.js
declare module 'metro-source-map/src/Consumer/positionMath' {
  import type { GeneratedOffset } from 'metro-source-map/src/Consumer/types.flow';
  import type { Number0, Number1 } from 'ob1';
  export function shiftPositionByOffset<
    T extends {
      readonly line?: null | Number1;
      readonly column?: null | Number0;
    },
  >(pos: T, offset: GeneratedOffset): T;
  export function subtractOffsetFromPosition<
    T extends {
      readonly line?: null | Number1;
      readonly column?: null | Number0;
    },
  >(pos: T, offset: GeneratedOffset): T;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/search.js
declare module 'metro-source-map/src/Consumer/search' {
  export function greatestLowerBound<T, U>(
    elements: readonly T[],
    target: U,
    comparator: ($$PARAM_0$$: U, $$PARAM_1$$: T) => number
  ): null | undefined | number;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/SectionsConsumer.js
declare module 'metro-source-map/src/Consumer/SectionsConsumer' {
  import type { IndexMap } from 'metro-source-map/src/source-map';
  import type {
    GeneratedOffset,
    GeneratedPositionLookup,
    IConsumer,
    Mapping,
    SourcePosition,
  } from 'metro-source-map/src/Consumer/types.flow';
  import AbstractConsumer from 'metro-source-map/src/Consumer/AbstractConsumer';
  /**
   * A source map consumer that supports "indexed" source maps (that have a
   * `sections` field and no top-level mappings).
   */
  class SectionsConsumer extends AbstractConsumer implements IConsumer {
    _consumers: readonly [GeneratedOffset, IConsumer][];
    constructor(sourceMap: IndexMap);
    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    generatedMappings(): Iterable<Mapping>;
    _consumerForPosition(
      generatedPosition: GeneratedPositionLookup
    ): null | undefined | [GeneratedOffset, IConsumer];
    sourceContentFor(source: string, nullOnMissing: true): null | undefined | string;
  }
  export default SectionsConsumer;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Consumer/types.flow.js
declare module 'metro-source-map/src/Consumer/types.flow' {
  import type { IterationOrder, LookupBias } from 'metro-source-map/src/Consumer/constants';
  import type { Number0, Number1 } from 'ob1';
  export type { IterationOrder, LookupBias };
  export type GeneratedOffset = {
    readonly lines: Number0;
    readonly columns: Number0;
  };
  export type SourcePosition = {
    source?: null | string;
    line?: null | Number1;
    column?: null | Number0;
    name?: null | string;
  };
  export type GeneratedPosition = {
    readonly line: Number1;
    readonly column: Number0;
  };
  export type GeneratedPositionLookup = {
    readonly line?: null | Number1;
    readonly column?: null | Number0;
    readonly bias?: LookupBias;
  };
  export type Mapping = {
    source?: null | string;
    generatedLine: Number1;
    generatedColumn: Number0;
    originalLine?: null | Number1;
    originalColumn?: null | Number0;
    name?: null | string;
  };
  export interface IConsumer {
    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    generatedMappings(): Iterable<Mapping>;
    eachMapping(callback: (mapping: Mapping) => any, context?: any, order?: IterationOrder): void;
    get file(): null | undefined | string;
    sourceContentFor(source: string, nullOnMissing: true): null | undefined | string;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/encode.js
declare module 'metro-source-map/src/encode' {
  /**
   * Encodes a number to base64 VLQ format and appends it to the passed-in buffer
   *
   * DON'T USE COMPOUND OPERATORS (eg `>>>=`) ON `let`-DECLARED VARIABLES!
   * V8 WILL DEOPTIMIZE THIS FUNCTION AND MAP CREATION WILL BE 25% SLOWER!
   *
   * DON'T ADD MORE COMMENTS TO THIS FUNCTION TO KEEP ITS LENGTH SHORT ENOUGH FOR
   * V8 OPTIMIZATION!
   */
  function encode(value: number, buffer: Buffer, position: number): number;
  export default encode;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/generateFunctionMap.js
declare module 'metro-source-map/src/generateFunctionMap' {
  import type * as _babel_types from '@babel/types';
  import type { FBSourceFunctionMap } from 'metro-source-map/src/source-map';
  import type { PluginObj } from '@babel/core';
  type Position = {
    line: number;
    column: number;
  };
  type RangeMapping = {
    name: string;
    start: Position;
  };
  export type Context = {
    filename?: null | undefined | string;
  };
  export function functionMapBabelPlugin(): PluginObj;
  export function generateFunctionMap(
    ast: _babel_types.Node,
    context?: Context
  ): FBSourceFunctionMap;
  export function generateFunctionMappingsArray(
    ast: _babel_types.Node,
    context?: Context
  ): readonly RangeMapping[];
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/Generator.js
declare module 'metro-source-map/src/Generator' {
  import type {
    BasicSourceMap,
    FBSourceFunctionMap,
    FBSourceMetadata,
  } from 'metro-source-map/src/source-map';
  import B64Builder from 'metro-source-map/src/B64Builder';
  type FileFlags = Readonly<{
    addToIgnoreList?: boolean;
  }>;
  /**
   * Generates a source map from raw mappings.
   *
   * Raw mappings are a set of 2, 4, or five elements:
   *
   * - line and column number in the generated source
   * - line and column number in the original source
   * - symbol name in the original source
   *
   * Mappings have to be passed in the order appearance in the generated source.
   */
  class Generator {
    builder: B64Builder;
    last: {
      generatedColumn: number;
      generatedLine: number;
      name: number;
      source: number;
      sourceColumn: number;
      sourceLine: number;
    };
    names: IndexedSet;
    source: number;
    sources: string[];
    sourcesContent: (null | undefined | string)[];
    x_facebook_sources: (null | undefined | FBSourceMetadata)[];
    x_google_ignoreList: number[];
    constructor();
    startFile(
      file: string,
      code: string,
      functionMap: null | undefined | FBSourceFunctionMap,
      flags?: FileFlags
    ): void;
    endFile(): void;
    addSimpleMapping(generatedLine: number, generatedColumn: number): void;
    addSourceMapping(
      generatedLine: number,
      generatedColumn: number,
      sourceLine: number,
      sourceColumn: number
    ): void;
    addNamedSourceMapping(
      generatedLine: number,
      generatedColumn: number,
      sourceLine: number,
      sourceColumn: number,
      name: string
    ): void;
    toMap(
      file?: string,
      options?: {
        excludeSource?: boolean;
      }
    ): BasicSourceMap;
    toString(
      file?: string,
      options?: {
        excludeSource?: boolean;
      }
    ): string;
    hasSourcesMetadata(): boolean;
  }
  class IndexedSet {
    map: Map<string, number>;
    nextIndex: number;
    constructor();
    indexFor(x: string): number;
    items(): string[];
  }
  export default Generator;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-source-map/src/source-map.js
declare module 'metro-source-map/src/source-map' {
  import type { IConsumer } from 'metro-source-map/src/Consumer/types.flow';
  import Generator from 'metro-source-map/src/Generator';
  export type { IConsumer };
  type GeneratedCodeMapping = [number, number];
  type SourceMapping = [number, number, number, number];
  type SourceMappingWithName = [number, number, number, number, string];
  export type MetroSourceMapSegmentTuple =
    | SourceMappingWithName
    | SourceMapping
    | GeneratedCodeMapping;
  export type HermesFunctionOffsets = {
    [$$Key$$: number]: readonly number[];
  };
  export type FBSourcesArray = readonly (null | undefined | FBSourceMetadata)[];
  export type FBSourceMetadata = [null | undefined | FBSourceFunctionMap];
  export type FBSourceFunctionMap = {
    readonly names: readonly string[];
    readonly mappings: string;
  };
  export type FBSegmentMap = {
    [id: string]: MixedSourceMap;
  };
  export type BasicSourceMap = {
    readonly file?: string;
    readonly mappings: string;
    readonly names: string[];
    readonly sourceRoot?: string;
    readonly sources: string[];
    readonly sourcesContent?: (null | undefined | string)[];
    readonly version: number;
    readonly x_facebook_offsets?: number[];
    readonly x_metro_module_paths?: string[];
    readonly x_facebook_sources?: FBSourcesArray;
    readonly x_facebook_segments?: FBSegmentMap;
    readonly x_hermes_function_offsets?: HermesFunctionOffsets;
    readonly x_google_ignoreList?: number[];
  };
  export type IndexMapSection = {
    map?: IndexMap | BasicSourceMap;
    offset: {
      line: number;
      column: number;
    };
  };
  export type IndexMap = {
    readonly file?: string;
    readonly mappings?: void;
    readonly sourcesContent?: void;
    readonly sections: IndexMapSection[];
    readonly version: number;
    readonly x_facebook_offsets?: number[];
    readonly x_metro_module_paths?: string[];
    readonly x_facebook_sources?: void;
    readonly x_facebook_segments?: FBSegmentMap;
    readonly x_hermes_function_offsets?: HermesFunctionOffsets;
    readonly x_google_ignoreList?: void;
  };
  export type MixedSourceMap = IndexMap | BasicSourceMap;
  export { BundleBuilder } from 'metro-source-map/src/BundleBuilder';
  export { default as composeSourceMaps } from 'metro-source-map/src/composeSourceMaps';
  export { default as Consumer } from 'metro-source-map/src/Consumer';
  export { createIndexMap } from 'metro-source-map/src/BundleBuilder';
  export { generateFunctionMap } from 'metro-source-map/src/generateFunctionMap';
  export function fromRawMappings(
    modules: readonly {
      readonly map?: null | MetroSourceMapSegmentTuple[];
      readonly functionMap?: null | FBSourceFunctionMap;
      readonly path: string;
      readonly source: string;
      readonly code: string;
      readonly isIgnored: boolean;
      readonly lineCount?: number;
    }[],
    offsetLines?: number
  ): Generator;
  export function fromRawMappingsNonBlocking(
    modules: readonly {
      readonly map?: null | MetroSourceMapSegmentTuple[];
      readonly functionMap?: null | FBSourceFunctionMap;
      readonly path: string;
      readonly source: string;
      readonly code: string;
      readonly isIgnored: boolean;
      readonly lineCount?: number;
    }[],
    offsetLines?: number
  ): Promise<Generator>;
  export { functionMapBabelPlugin } from 'metro-source-map/src/generateFunctionMap';
  export { default as normalizeSourcePath } from 'metro-source-map/src/Consumer/normalizeSourcePath';
  // NOTE(cedric): see https://github.com/facebook/metro/blob/a36e992ac74c5497e58b91d99c2bab21c7fa1451/flow-typed/npm/babel_v7.x.x.js#L23
  export type BabelSourceMapSegment = {
    name?: null | string;
    source?: null | string;
    generated: { line: number; column: number };
    original?: { line: number; column: number };
  } & Record<string, any>;
  export function toBabelSegments(sourceMap: BasicSourceMap): BabelSourceMapSegment[];
  export function toSegmentTuple(mapping: BabelSourceMapSegment): MetroSourceMapSegmentTuple;
}
