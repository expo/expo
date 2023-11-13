/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Module } from 'metro';
export declare function processModules(modules: readonly Module[], { filter, createModuleId, dev, includeAsyncPaths, projectRoot, serverRoot, sourceUrl, platform, basePath, splitChunks, }: {
    platform: string;
    basePath: string;
    splitChunks: boolean;
    filter?: (module: Module) => boolean;
    createModuleId: (module: string) => number;
    dev: boolean;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    sourceUrl: string | undefined;
}): readonly [Module, {
    src: string;
    paths: Record<string, string>;
}][];
