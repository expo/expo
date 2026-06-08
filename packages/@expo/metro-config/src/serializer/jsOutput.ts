/**
 * Copyright © 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { types as t } from '@babel/core';
import type { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from '@expo/metro/metro-source-map';
import type { JsTransformerConfig } from '@expo/metro/metro-transform-worker';

import type { PackedMap, SerializableSourceMap } from './packedMap';
import type { Options as CollectDependenciesOptions } from '../transform-worker/collect-dependencies';

export type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';

// `data.map` is one of three shapes depending on the pipeline stage:
//   - `SerializableSourceMap` from the worker / metro-cache.
//   - The `Array.isArray`-true Proxy installed on the main thread by
//     Expo's `Bundler.transformFile` wrapper — what every reader sees.
//   - Plain `MetroSourceMapSegmentTuple[]` from custom transformers, or
//     legacy cache entries written before `SerializableSourceMap` existed.
export type ModuleSourceMap = SerializableSourceMap | MetroSourceMapSegmentTuple[];

export type JsOutput = {
  data: {
    code: string;
    lineCount: number;
    map: ModuleSourceMap;
    // Non-enumerable so it doesn't survive `{...data}` spreads; the
    // encoder fast path reads it off the original `data` object to
    // iterate the underlying `Int32Array` directly.
    readonly __packedMap?: PackedMap;
    functionMap: FBSourceFunctionMap | null;

    css?: {
      code: string;
      lineCount: number;
      map: MetroSourceMapSegmentTuple[];
      functionMap: FBSourceFunctionMap | null;
    };

    ast?: t.File;

    hasCjsExports?: boolean;

    readonly reconcile?: ReconcileTransformSettings;
    readonly reactServerReference?: string;
    readonly reactClientReference?: string;
    readonly expoDomComponentReference?: string;
    readonly loaderReference?: string;
  };
  type: JSFileType;
};

export type CSSMetadata = {
  code: string;
  lineCount: number;
  map: unknown[];
  functionMap: null;
  skipCache?: boolean;
  externalImports: { url: string; supports: string | null; media: string | null }[];
};

export type ExpoJsOutput = Omit<JsOutput, 'data'> & {
  data: JsOutput['data'] & {
    profiling?: {
      start: number;
      end: number;
      duration: number;
    };
    css?: CSSMetadata;
  };
};

export type ReconcileTransformSettings = {
  inlineRequires: boolean;
  importDefault: string;
  importAll: string;
  globalPrefix: string;
  unstable_renameRequire?: boolean;
  unstable_compactOutput?: boolean;
  minify?: {
    minifierPath: string;
    minifierConfig: JsTransformerConfig['minifierConfig'];
  };
  collectDependenciesOptions: CollectDependenciesOptions;

  unstable_dependencyMapReservedName?: string | null;
  optimizationSizeLimit?: number;
  unstable_disableNormalizePseudoGlobals?: boolean;

  normalizePseudoGlobals: boolean;
};

export function isExpoJsOutput(output: any): output is ExpoJsOutput {
  return 'data' in output && typeof output.data === 'object';
}

// Because transform options can be passed directly during export, or through a query parameter
// during a request, we need to normalize the options.
export function isTransformOptionTruthy(option: any): boolean {
  return option === true || option === 'true' || option === '1';
}
