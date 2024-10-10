/**
 * Copyright © 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { JsOutput, JsTransformerConfig } from 'metro-transform-worker';

import { Options as CollectDependenciesOptions } from '../transform-worker/collect-dependencies';

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
    readonly reconcile?: ReconcileTransformSettings;

    ast?: import('@babel/types').File;

    css?: CSSMetadata;

    hasCjsExports?: boolean;
    readonly reactClientReference?: string;
    readonly expoDomComponentReference?: string;
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

  unstable_dependencyMapReservedName?: string;
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
