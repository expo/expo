/// <reference types="node" />
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { JsTransformerConfig, JsTransformOptions, TransformResponse } from 'metro-transform-worker';
export declare function convertSvgModule(projectRoot: string, src: string, options: Pick<JsTransformOptions, 'platform'>): Promise<string>;
export declare function transformSvg(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export declare function matchSvgModule(filePath: string): boolean;
