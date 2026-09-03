import { getScreenIdForLinking } from 'test-suite/screens/getScreenIdForLinking';

import { type ScreenConfig } from '../types/ScreenConfig';
import { Screens as apiScreens } from './apiScreens';
import { Screens as componentScreens } from './componentScreens';

function buildRegistry(screens: ScreenConfig[]): Map<string, ScreenConfig> {
  const registry = new Map<string, ScreenConfig>();
  for (const screen of screens) {
    const id = getScreenIdForLinking(screen);
    // Ids are derived from display names, so two screens can collapse to the same id and
    // silently shadow each other, leaving one unreachable by deep link.
    if (__DEV__ && registry.has(id)) {
      console.warn(
        `Duplicate screen id "${id}": "${screen.name}" overrides "${registry.get(id)?.name}", which becomes unreachable by deep link. Give the screens unique names or routes.`
      );
    }
    registry.set(id, screen);
  }
  return registry;
}

let apiScreenRegistry: Map<string, ScreenConfig> | null = null;
let componentScreenRegistry: Map<string, ScreenConfig> | null = null;

/**
 * Looks up an "APIs" tab screen by its deep-link id (e.g. `haptics`, `background-location`).
 */
export function findApiScreen(id: string): ScreenConfig | undefined {
  apiScreenRegistry ??= buildRegistry(apiScreens);
  return apiScreenRegistry.get(id);
}

/**
 * Looks up a "Components" tab screen by its deep-link id.
 * Ids may contain slashes for nested routes (e.g. `image/comparison`, `video/pip`).
 */
export function findComponentScreen(id: string): ScreenConfig | undefined {
  componentScreenRegistry ??= buildRegistry(componentScreens);
  return componentScreenRegistry.get(id);
}
