import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { NativeStackDescriptorMap } from '../descriptors-context';
import type { CompositionRegistry } from './types';
export type MergeOptionsCacheEntry = {
    descriptor: NativeStackDescriptorMap[string];
    routeOptions: Map<string, Partial<NativeStackNavigationOptions>> | undefined;
    result: NativeStackDescriptorMap[string];
};
/**
 * Merges composition component options into navigation descriptors.
 *
 * For each descriptor:
 * 1. If no composition options registered → pass through unchanged
 * 2. If route is preloaded AND not focused → skip composition (pass through)
 * 3. Otherwise → merge descriptor.options with composition options (composition wins)
 */
export declare function mergeOptions(descriptors: NativeStackDescriptorMap, registry: CompositionRegistry, state: StackNavigationState<ParamListBase>): NativeStackDescriptorMap;
//# sourceMappingURL=mergeOptions.d.ts.map