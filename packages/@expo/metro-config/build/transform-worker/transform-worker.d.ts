/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import type { Dependency } from './collect-dependencies';
import type { ExpoJsTransformerConfig } from './types';
import type { ExpoJsOutput } from '../serializer/jsOutput';
export interface TransformResponse {
    readonly dependencies: readonly Dependency[];
    readonly output: readonly ExpoJsOutput[];
}
export declare function transform(config: ExpoJsTransformerConfig, projectRoot: string, filename: string, data: Buffer, options: JsTransformOptions): Promise<TransformResponse>;
