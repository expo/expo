/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Module } from '@expo/metro/metro/DeltaBundler';

import type { Options } from './js';
import { isJsModule, wrapModule } from './js';

export function processModules(
  modules: readonly Module[],
  {
    filter = () => true,
    ...options
  }: Options & {
    filter?: (module: Module) => boolean;
  }
): readonly [Module, ReturnType<typeof wrapModule>][] {
  return [...modules]
    .filter(isJsModule)
    .filter(filter)
    .map((module: Module) => [module, wrapModule(module, options)]);
}
