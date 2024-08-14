// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/source-map.js (entry point)
declare module '@expo/metro/metro-source-map' {
  // TODO: there should be more here
  import { FBSourceFunctionMap } from 'metro-source-map';

  export { default as BundleBuilder } from '@expo/metro/metro-source-map/BundleBuilder';

  export type {
    BasicSourceMap,
    FBSourceFunctionMap,
    FBSourceMetadata,
    IndexMap,
    IndexMapSection,
    MixedSourceMap,
  } from 'metro-source-map';

  type GeneratedCodeMapping = [number, number];
  type SourceMapping = [number, number, number, number];
  type SourceMappingWithName = [number, number, number, number, string];

  export type MetroSourceMapSegmentTuple =
    | SourceMappingWithName
    | SourceMapping
    | GeneratedCodeMapping;

  export function fromRawMappings(
    modules: readonly {
      map?: MetroSourceMapSegmentTuple[] | null; // ?Array<MetroSourceMapSegmentTuple>
      functionMap?: FBSourceFunctionMap | null; // ?FBSourceFunctionMap
      path: string;
      source: string;
      code: string;
      isIgnored: boolean;
      lineCount?: number;
    }[],
    offsetLines: number
  ): Generator;

  export function fromRawMappingsNonBlocking(
    modules: readonly {
      map?: MetroSourceMapSegmentTuple[] | null; // ?Array<MetroSourceMapSegmentTuple>
      functionMap?: FBSourceFunctionMap | null; // ?FBSourceFunctionMap
      path: string;
      source: string;
      code: string;
      isIgnored: boolean;
      lineCount?: number;
    }[],
    offsetLines: number
  ): Promise<Generator>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/B64Builder.js
declare module '@expo/metro/metro-source-map/B64Builder' {
  export default class B64Builder {
    buffer: Buffer;
    pos: number;
    hasSegment: boolean;

    /**
     * Adds `n` markers for generated lines to the mappings.
     */
    markLines(n: number): this;

    /**
     * Starts a segment at the specified column offset in the current line.
     */
    startSegment(column: number): this;

    /**
     * Appends a single number to the mappings.
     */
    append(value: number): this;

    /**
     * Returns the string representation of the mappings.
     */
    toString(): string;

    _writeByte(byte: number): void;
    _realloc(): void;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/BundleBuilder.js
declare module '@expo/metro/metro-source-map/BundleBuilder' {
  import type { IndexMap, IndexMapSection, MixedSourceMap } from '@expo/metro/metro-source-map';

  export function createIndexMap(file: string, sections: IndexMapSection[]): IndexMap;

  export class BundleBuilder {
    constructor(file: string);

    getMap(): MixedSourceMap;
    getCode(): string;
    append(
      code: string,
      map?: MixedSourceMap | null // ?MixedSourceMap
    ): this;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Generator.js
declare module '@expo/metro/metro-source-map/Generator' {
  import type B64Builder from '@expo/metro/metro-source-map/B64Builder';
  import type { BasicSourceMap, FBSourceFunctionMap, FBSourceMetadata } from 'metro-source-map';

  type FileFlags = Readonly<{
    addToIgnoreList?: boolean;
  }>;

  class IndexedSet {
    map: Map<string, number>;
    nextIndex: number;
    indexFor(x: string): number;
    items(): string[];
  }

  export default class Generator {
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
    sourcesContent: (string | undefined)[];
    x_facebook_sources: (FBSourceMetadata | undefined)[];
    // https://developer.chrome.com/blog/devtools-better-angular-debugging/#the-x_google_ignorelist-source-map-extension
    x_google_ignoreList: number[];

    /** Mark the beginning of a new source file. */
    startFile(
      file: string,
      code: string,
      functionMap?: FBSourceFunctionMap,
      flags?: FileFlags
    ): void;

    /** Mark the end of the current source file */
    endFile(): void;

    /** Adds a mapping for generated code without a corresponding source location. */
    addSimpleMapping(generatedLine: number, generatedColumn: number): void;

    /** Adds a mapping for generated code with a corresponding source location. */
    addSourceMapping(
      generatedLine: number,
      generatedColumn: number,
      sourceLine: number,
      sourceColumn: number
    ): void;

    /** Adds a mapping for code with a corresponding source location + symbol name. */
    addNamedSourceMapping(
      generatedLine: number,
      generatedColumn: number,
      sourceLine: number,
      sourceColumn: number,
      name: string
    ): void;

    /** Return the source map as object. */
    toMap(
      file?: string,
      options?: { excludeSource?: boolean } & Record<string, any>
    ): BasicSourceMap;

    /**
     * Return the source map as string.
     * This is ~2.5x faster than calling `JSON.stringify(generator.toMap())`
     */
    toString(file?: string, options?: { excludeSource?: boolean } & Record<string, any>): string;

    /**
     * Determine whether we need to write the `x_facebook_sources` field.
     * If the metadata is all `null`s, we can omit the field entirely.
     */
    hasSourcesMetadata(): boolean;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/composeSourceMaps.js
declare module '@expo/metro/metro-source-map/composeSourceMaps' {
  import type { MixedSourceMap } from '@expo/metro/metro-source-map';

  export function composeSourceMaps(maps: readonly MixedSourceMap[]): MixedSourceMap;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/encode.js
declare module '@expo/metro/metro-source-map/encode' {
  /**
   * Encodes a number to base64 VLQ format and appends it to the passed-in buffer
   *
   * DON'T USE COMPOUND OPERATORS (eg `>>>=`) ON `let`-DECLARED VARIABLES!
   * V8 WILL DEOPTIMIZE THIS FUNCTION AND MAP CREATION WILL BE 25% SLOWER!
   *
   * DON'T ADD MORE COMMENTS TO THIS FUNCTION TO KEEP ITS LENGTH SHORT ENOUGH FOR
   * V8 OPTIMIZATION!
   */
  export default function encode(value: number, buffer: Buffer, position: number): number;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/generateFunctionMap.js
declare module '@expo/metro/metro-source-map/generateFunctionMap' {
  import type { PluginObj as BabelPluginObject, Node as BabelNode } from '@babel/core';
  import type { FBSourceFunctionMap } from '@expo/metro/metro-source-map';

  type Position = {
    line: number;
    column: number;
    [key: string]: any; // ...
  };

  type RangeMapping = {
    name: string;
    start: Position;
    [key: string]: any; // ...
  };

  export type Context = {
    filename?: string | null; // ?string
    [key: string]: any; // ...
  };

  export function functionMapBabelPlugin(): BabelPluginObject;

  /**
   * Generate a map of source positions to function names. The names are meant to
   * describe the stack frame in an error trace and may contain more contextual
   * information than just the actual name of the function.
   *
   * The output is encoded for use in a source map. For details about the format,
   * see MappingEncoder below.
   */
  export function generateFunctionMap(ast: BabelNode, context?: Context): FBSourceFunctionMap;

  /**
   * Same as generateFunctionMap, but returns the raw array of mappings instead
   * of encoding it for use in a source map.
   *
   * Lines are 1-based and columns are 0-based.
   */
  export function generateFunctionMappingsArray(
    ast: BabelNode,
    context?: Context
  ): readonly RangeMapping[];
}

// #region /Consumer/

// #region /Consumer

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/index.js
declare module '@expo/metro/metro-source-map/Consumer/index' {
  export { default } from '@expo/metro/metro-source-map/Consumer/DelegatingConsumer';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/AbstractConsumer.js
declare module '@expo/metro/metro-source-map/Consumer/AbstractConsumer' {
  import type { IterationOrder } from '@expo/metro/metro-source-map/Consumer/constants';
  import type {
    GeneratedPositionLookup,
    IConsumer,
    Mapping,
    SourcePosition,
  } from '@expo/metro/metro-source-map/Consumer/types';

  export default class AbstractConsumer implements IConsumer {
    constructor(sourceMap: {
      file?: string;
      [key: string]: any; // ...
    });

    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    generatedMappings(): Iterable<Mapping>;
    eachMapping(callback: (mapping: Mapping) => any, context?: any, order?: IterationOrder): void;
    get file(): string | null | undefined; // ?string
    sourceContentFor(source: string, nullOnMissing: true): string | null | undefined; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/DelegatingConsumer.js
declare module '@expo/metro/metro-source-map/Consumer/DelegatingConsumer' {
  import type { MixedSourceMap } from '@expo/metro/metro-source-map';
  import {
    type IterationOrder,
    GENERATED_ORDER,
    ORIGINAL_ORDER,
    GREATEST_LOWER_BOUND,
    LEAST_UPPER_BOUND,
  } from '@expo/metro/metro-source-map/Consumer/constants';
  import type {
    GeneratedPositionLookup,
    IConsumer,
    Mapping,
    SourcePosition,
  } from '@expo/metro/metro-source-map/Consumer/types';

  export default class DelegatingConsumer implements IConsumer {
    static GENERATED_ORDER: typeof GENERATED_ORDER;
    static ORIGINAL_ORDER: typeof ORIGINAL_ORDER;
    static GREATEST_LOWER_BOUND: typeof GREATEST_LOWER_BOUND;
    static LEAST_UPPER_BOUND: typeof LEAST_UPPER_BOUND;

    constructor(sourceMap: MixedSourceMap);

    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;
    generatedMappings(): Iterable<Mapping>;
    eachMapping(callback: (mapping: Mapping) => any, context?: any, order?: IterationOrder): void;
    get file(): string | null | undefined; // ?string
    sourceContentFor(source: string, nullOnMissing: true): string | null | undefined; // ?string
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/MappingsConsumer.js
declare module '@expo/metro/metro-source-map/Consumer/MappingsConsumer' {
  import { default as AbstractConsumer } from '@expo/metro/metro-source-map/Consumer/AbstractConsumer';
  import type { BasicSourceMap } from '@expo/metro/metro-source-map';
  import type { IConsumer } from '@expo/metro/metro-source-map/Consumer/types';

  export default class MappingsConsumer extends AbstractConsumer implements IConsumer {
    constructor(sourceMap: BasicSourceMap);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/SectionsConsumer.js
declare module '@expo/metro/metro-source-map/Consumer/SectionsConsumer' {
  import { default as AbstractConsumer } from '@expo/metro/metro-source-map/Consumer/AbstractConsumer';
  import type { IndexMap } from '@expo/metro/metro-source-map';
  import type { IConsumer } from '@expo/metro/metro-source-map/Consumer/types';

  export default class SectionsConsumer extends AbstractConsumer implements IConsumer {
    constructor(sourceMap: IndexMap);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/constants.js
declare module '@expo/metro/metro-source-map/Consumer/constants' {
  import type { Number0, Number1 } from 'ob1';

  export const FIRST_COLUMN: Number0;
  export const FIRST_LINE: Number1;

  export type IterationOrder = 'GENERATED_ORDER' | 'ORIGINAL_ORDER'; // opaque type
  export const GENERATED_ORDER: 'GENERATED_ORDER';
  export const ORIGINAL_ORDER: 'ORIGINAL_ORDER';

  export type LookupBias = 'GREATEST_LOWER_BOUND' | 'LEAST_UPPER_BOUND'; // opaque type
  export const GREATEST_LOWER_BOUND: 'GREATEST_LOWER_BOUND';
  export const LEAST_UPPER_BOUND: 'LEAST_UPPER_BOUND';

  export const EMPTY_POSITION: {
    source: null;
    name: null;
    line: null;
    column: null;
  }; // Frozen object

  export function iterationOrderToString(x: IterationOrder): string;
  export function lookupBiasToString(x: LookupBias): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/createConsumer.js
declare module '@expo/metro/metro-source-map/Consumer/createConsumer' {
  import type { MixedSourceMap } from '@expo/metro/metro-source-map';
  import type { IConsumer } from '@expo/metro/metro-source-map/Consumer/types';

  export default function createConsumer(sourceMap: MixedSourceMap): IConsumer;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/normalizeSourcePath.js
declare module '@expo/metro/metro-source-map/Consumer/normalizeSourcePath' {
  export default function normalizeSourcePath(
    sourceInput: string,
    map: {
      sourceRoot?: string | null; // ?string
      [key: string]: any; // ...
    }
  ): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/positionMath.js
declare module '@expo/metro/metro-source-map/Consumer/positionMath' {
  import type { Number0, Number1 } from 'ob1';
  import type { GeneratedOffset } from '@expo/metro/metro-source-map/Consumer/types';

  type Position = {
    line: Number1 | null; // ?Number1
    column: Number0 | null; // ?Number0
    [key: string]: any; // ...
  };

  export function shiftPositionByOffset<T = Position>(pos: T, offset: GeneratedOffset): T;
  export function subtractOffsetFromPosition<T = Position>(pos: T, offset: GeneratedOffset): T;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/search.js
declare module '@expo/metro/metro-source-map/Consumer/search' {
  export function greatestLowerBound<T, U>(
    elements: readonly T[],
    target: U,
    comparator: (a: U, b: T) => number
  ): number | null | undefined; // ?number
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/types.flow.js
declare module '@expo/metro/metro-source-map/Consumer/types' {
  import type { IterationOrder, LookupBias } from '@expo/metro/metro-source-map/Consumer/constants';
  import type { Number0, Number1 } from 'ob1';

  export type { IterationOrder, LookupBias };

  export type GeneratedOffset = { lines: Number0; columns: Number0 };
  export type SourcePosition = {
    source?: string | null; // ?string
    line?: Number1 | null; // ?Number1
    column?: Number0 | null; // ?Number0
    name?: string | null; // ?string
    [key: string]: any; // ...
  };

  export type GeneratedPosition = {
    line: Number1;
    column: Number0;
    [key: string]: any; // ...
  };

  export type GeneratedPositionLookup = {
    line?: Number1 | null; // ?Number1
    column?: Number0 | null; // ?Number0
    bias?: LookupBias;
    [key: string]: any; // ...
  };

  export type Mapping = {
    source?: string | null; // ?string
    generatedLine: Number1;
    generatedColumn: Number0;
    originalLine?: Number1 | null; // ?Number1
    originalColumn?: Number0 | null; // ?Number0
    name?: string | null; // ?string
    [key: string]: any; // ...
  };

  export interface IConsumer {
    originalPositionFor(generatedPosition: GeneratedPositionLookup): SourcePosition;

    generatedMappings(): Iterable<Mapping>;

    eachMapping(callback: (mapping: Mapping) => any, context?: any, order?: IterationOrder): void;

    get file(): string | null | undefined; // ?string

    sourceContentFor(
      source: string,
      /* nullOnMissing = false behaves inconsistently upstream, so we don't support it */
      nullOnMissing: true
    ): string | null | undefined; // ?string
  }
}
