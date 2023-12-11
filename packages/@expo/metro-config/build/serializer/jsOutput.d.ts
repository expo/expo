/**
 * Copyright © 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from 'metro-source-map';
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
export declare function isExpoJsOutput(output: any): output is ExpoJsOutput;
export declare function isTransformOptionTruthy(option: any): boolean;
