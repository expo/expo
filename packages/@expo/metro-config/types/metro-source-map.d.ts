// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/source-map.js (entry point)
declare module '@expo/metro-config/metro-source-map' {
  import { FBSourceFunctionMap } from 'metro-source-map';

  export type * from 'metro-source-map';

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
declare module '@expo/metro-config/metro-source-map/B64Builder' {
  class B64Builder {
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

  export = B64Builder;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Generator.js
declare module '@expo/metro-config/metro-source-map/Generator' {
  import type B64Builder from '@expo/metro-config/metro-source-map/B64Builder';
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

  export = Generator;
}

// #region /Consumer

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/constants.js
declare module '@expo/metro-config/metro-source-map/Consumer/constants' {
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

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-source-map/src/Consumer/types.flow.js
declare module '@expo/metro-config/metro-source-map/Consumer/types' {
  import type {
    IterationOrder,
    LookupBias,
  } from '@expo/metro-config/metro-source-map/Consumer/constants';
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
