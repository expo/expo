/**
 * Copyright 2024-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/facebook/metro/blob/96c6b893eb77b5929b6050d7189905232ddf6d6d/packages/metro-transform-worker/src/index.js#L679
 */
import type { MetroSourceMapSegmentTuple } from '@expo/metro/metro-source-map';
export declare function countLinesAndTerminateMap(code: string, map: readonly MetroSourceMapSegmentTuple[]): {
    lineCount: number;
    map: MetroSourceMapSegmentTuple[];
};
