/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from '@expo/metro/metro/DeltaBundler/types.flow';
type AdvancedModule = Module<MixedOutput> & {
    sideEffects?: boolean | null;
};
export declare function hasSideEffectWithDebugTrace(options: SerializerOptions, graph: ReadOnlyGraph, value: AdvancedModule, parentTrace?: string[], checked?: Set<string>): [boolean | null, string[]];
export declare function _createSideEffectMatcher(dirRoot: string, packageJson: {
    sideEffects?: boolean | string[];
}, packageJsonPath?: string): (fp: string) => boolean | null;
export declare function isVirtualModule(path: string): boolean;
export {};
