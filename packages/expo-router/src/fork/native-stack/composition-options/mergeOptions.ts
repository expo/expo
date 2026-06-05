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
export function mergeOptions(
  descriptors: NativeStackDescriptorMap,
  registry: CompositionRegistry,
  state: NativeStackViewState
): NativeStackDescriptorMap {
  const result: NativeStackDescriptorMap = {};

  for (const key in descriptors) {
    const descriptor = descriptors[key]!;
    const routeOptions = registry[key];

    // No composition options or empty array → pass through
    if (!routeOptions || routeOptions.length === 0) {
      result[key] = descriptor;
      continue;
    }

    // Check if route is preloaded (rendered after the focused route) → skip composition
    const position = state.routes.findIndex((route) => route.key === key);
    if (position > state.index) {
      result[key] = descriptor;
      continue;
    }

    // Merge: descriptor options as base, composition options override
    const mergedOptions = Object.assign({}, descriptor.options, ...routeOptions);

    const merged = {
      ...descriptor,
      options: mergedOptions,
    };

    result[key] = merged;
  }

  return result;
}
