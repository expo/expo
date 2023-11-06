/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MixedOutput, Module } from 'metro';
import type { JsOutput } from 'metro-transform-worker';
export type Options = {
    createModuleId: (module: string) => number | string;
    dev: boolean;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
    sourceUrl: string | undefined;
};
export declare function wrapModule(module: Module, options: Options): {
    src: string;
    paths: Record<string, string>;
};
export declare function getModuleParams(module: Module, options: Options): {
    params: any[];
    paths: Record<string, string>;
};
export declare function getExportPathForDependency(dependencyPath: string, options: Pick<Options, 'sourceUrl' | 'serverRoot'>): string;
export declare function getExportPathForDependencyWithOptions(dependencyPath: string, { platform, serverRoot }: {
    platform: string;
    serverRoot: string;
}): string;
export declare function getJsOutput(module: {
    output: readonly MixedOutput[];
    path?: string;
}): JsOutput;
export declare function isJsModule(module: Module): boolean;
export declare function isJsOutput(output: MixedOutput): output is MixedOutput;
