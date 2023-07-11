/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import type { Bundle } from 'metro-runtime/src/modules/types.flow';
export declare function baseJSBundle(entryPoint: string, preModules: readonly Module[], graph: ReadOnlyGraph, options: SerializerOptions): Bundle;
