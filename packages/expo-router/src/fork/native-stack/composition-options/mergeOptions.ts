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
export function mergeOptions(
  descriptors: NativeStackDescriptorMap,
  registry: CompositionRegistry,
  state: StackNavigationState<ParamListBase>
): NativeStackDescriptorMap {
  const result: NativeStackDescriptorMap = {};
  const focusedKey = state.routes[state.index]?.key;

  for (const key of Object.keys(descriptors)) {
    const descriptor = descriptors[key];
    const routeOptions = registry.get(key);

    // No composition options or empty map → pass through
    if (!routeOptions || routeOptions.size === 0) {
      result[key] = descriptor;
      continue;
    }

    // Check if route is preloaded and not focused → skip composition
    const isPreloaded = state.preloadedRoutes?.some((r) => r.key === key) ?? false;
    if (isPreloaded && key !== focusedKey) {
      result[key] = descriptor;
      continue;
    }

    // Merge: descriptor options as base, composition options override
    const mergedOptions = Object.assign({}, descriptor.options, ...routeOptions.values());

    const merged = {
      ...descriptor,
      options: mergedOptions,
    };

    result[key] = merged;
  }

  return result;
}
