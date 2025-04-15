/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { TransformResultDependency } from '@bycedric/metro/metro/DeltaBundler';
import type { JsOutput, JsTransformerConfig, JsTransformOptions } from '@bycedric/metro/metro-transform-worker';
type TransformResponse = {
    dependencies: readonly TransformResultDependency[];
    output: readonly JsOutput[];
};
export declare function transform(config: JsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
export {};
