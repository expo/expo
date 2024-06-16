declare module 'metro-source-map' {
  import type {
    BasicSourceMap,
    FBSourceFunctionMap,
    MetroSourceMapSegmentTuple,
  } from 'metro-source-map/src/source-map';

  type GeneratedCodeMapping = [number, number];
  type SourceMapping = [number, number, number, number];
  type SourceMappingWithName = [number, number, number, number, string];

  type HermesFunctionOffsets = { [key: number]: Readonly<Array<number>> };

  export type MetroSourceMapSegmentTuple =
    | SourceMappingWithName
    | SourceMapping
    | GeneratedCodeMapping;

  type FBSourcesArray = Readonly<Array<FBSourceMetadata | null>>;
  type FBSourceMetadata = [FBSourceFunctionMap | null];

  export { FBSourceFunctionMap };

  type FBSegmentMap = { [id: string]: MixedSourceMap };

  interface IndexMapSection {
    map: IndexMap | BasicSourceMap;
    offset: {
      line: number;
      column: number;
    };
  }

  interface IndexMap {
    file?: string;
    mappings?: void; // avoids SourceMap being a disjoint union
    sections: Array<IndexMapSection>;
    version: number;
    x_facebook_offsets?: Array<number>;
    x_metro_module_paths?: Array<string>;
    x_facebook_sources?: FBSourcesArray;
    x_facebook_segments?: FBSegmentMap;
    x_hermes_function_offsets?: HermesFunctionOffsets;
  }

  type MixedSourceMap = IndexMap | BasicSourceMap;

  //#endregion

  //#region metro-source-map/src/composeSourceMaps.js.flow

  export function composeSourceMaps(maps: Readonly<Array<MixedSourceMap>>): MixedSourceMap;

  //#endregion

  //#region metro-source-map/src/composeSourceMaps.js.flow

  import type { Ast } from '@babel/core';

  type Context = { filename?: string };

  /**
   * Generate a map of source positions to function names. The names are meant to
   * describe the stack frame in an error trace and may contain more contextual
   * information than just the actual name of the function.
   *
   * The output is encoded for use in a source map. For details about the format,
   * see MappingEncoder below.
   */
  export function generateFunctionMap(ast: Ast, context?: Context): FBSourceFunctionMap;

  export * from 'metro-source-map/src/source-map';
  import { MixedSourceMap } from 'metro-source-map/src/source-map';

  // `composeSourceMaps` is not exported from metro.
  // This ts-declarations is used and shared for `@expo/dev-server`.
  export function composeSourceMaps(maps: Readonly<MixedSourceMap[]>): MixedSourceMap;

  import type { GeneratorResult } from '@babel/generator';

  type BabelSourceMapSegment = NonNullable<GeneratorResult['map']>;

  export function toSegmentTuple(mapping: BasicSourceMap): MetroSourceMapSegmentTuple;

  export function toBabelSegments(mapping: BasicSourceMap): BasicSourceMap[];

  export function functionMapBabelPlugin(): unknown;

  export function fromRawMappings(
    modules: {
      map: MetroSourceMapSegmentTuple[] | null;
      functionMap: FBSourceFunctionMap | null;
      path: string;
      source: string;
      code: string;
      isIgnored: boolean;
      lineCount?: number;
    }[],
    offsetLines?: number
  ): any;
}
