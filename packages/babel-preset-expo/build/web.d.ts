/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ConfigAPI, TransformOptions } from '@babel/core';
import { BabelPresetExpoOptions } from './common';
export declare function babelPresetExpoWeb(api: ConfigAPI, options?: BabelPresetExpoOptions): TransformOptions;
