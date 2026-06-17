import type { NativeStackViewState } from '../../../react-navigation/native-stack';
import type { NativeStackDescriptorMap } from '../descriptors-context';
import type { CompositionRegistry } from './types';
/**
 * Merges composition component options into navigation descriptors.
 *
 * Expects the projected state where preloaded routes are appended after `index`.
 *
 * For each descriptor:
 * 1. If no composition options registered → pass through unchanged
 * 2. If route is preloaded (positioned after the focused route) → skip composition (pass through)
 * 3. Otherwise → merge descriptor.options with composition options (composition wins)
 */
export declare function mergeOptions(descriptors: NativeStackDescriptorMap, registry: CompositionRegistry, state: NativeStackViewState): NativeStackDescriptorMap;
//# sourceMappingURL=mergeOptions.d.ts.map