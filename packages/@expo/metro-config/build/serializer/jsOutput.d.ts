/**
 * Copyright © 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from 'metro-source-map';
import { JsTransformerConfig } from 'metro-transform-worker';
import { Options as CollectDependenciesOptions } from '../transform-worker/collect-dependencies';
export type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';
export type JsOutput = {
    data: {
        code: string;
        lineCount: number;
        map: MetroSourceMapSegmentTuple[];
        functionMap: FBSourceFunctionMap | null;
        css?: {
            code: string;
            lineCount: number;
            map: MetroSourceMapSegmentTuple[];
            functionMap: FBSourceFunctionMap | null;
        };
        ast?: import('@babel/types').File;
        hasCjsExports?: boolean;
        readonly reconcile?: ReconcileTransformSettings;
        readonly reactClientReference?: string;
        readonly expoDomComponentReference?: string;
    };
    type: JSFileType;
};
export type ExpoJsOutput = Omit<JsOutput, 'data'> & {
    data: JsOutput['data'] & {
        profiling?: {
            start: number;
            end: number;
            duration: number;
        };
        css?: {
            code: string;
            lineCount: number;
            map: unknown[];
            functionMap: null;
            skipCache?: boolean;
        };
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
export declare function isExpoJsOutput(output: any): output is ExpoJsOutput;
export declare function isTransformOptionTruthy(option: any): boolean;
