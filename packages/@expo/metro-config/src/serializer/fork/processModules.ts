/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Module } from '@bycedric/metro/metro/src/DeltaBundler/types.flow';

import { isJsModule, wrapModule } from './js';

export function processModules(
  modules: readonly Module[],
  {
    filter = () => true,
    createModuleId,
    dev,
    includeAsyncPaths,
    projectRoot,
    serverRoot,
    sourceUrl,
    splitChunks,
    skipWrapping,
    computedAsyncModulePaths,
  }: {
    splitChunks: boolean;
    filter?: (module: Module) => boolean;
    createModuleId: (module: string) => number;
    dev: boolean;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    sourceUrl: string | undefined;
    skipWrapping: boolean;
    computedAsyncModulePaths: Record<string, string> | null;
  }
): readonly [Module, { src: string; paths: Record<string, string> }][] {
  return [...modules]
    .filter(isJsModule)
    .filter(filter)
    .map((module: Module) => [
      module,
      wrapModule(module, {
        splitChunks,
        createModuleId,
        dev,
        includeAsyncPaths,
        projectRoot,
        serverRoot,
        sourceUrl,
        skipWrapping,
        computedAsyncModulePaths,
      }),
    ]);
}
