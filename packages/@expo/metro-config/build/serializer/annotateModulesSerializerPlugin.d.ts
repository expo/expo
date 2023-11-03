/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
export declare function annotateModule(projectRoot: string, mod: Module<MixedOutput>): Module<MixedOutput>;
export declare function createAnnotateModulesSerializerPlugin({ force }: {
    force?: boolean;
}): (entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions) => [entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph<MixedOutput>, options: SerializerOptions<MixedOutput>];
