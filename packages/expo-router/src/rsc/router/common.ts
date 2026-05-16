/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type RouteProps = {
  path: string;
  query: string;
  hash: string;
};

export { getComponentIds, mintComponentId, type ComponentIdKind } from './idMinting';

export function getInputString(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('Path should start with `/`');
  }
  return path.slice(1);
}

export function parseInputString(input: string): string {
  return '/' + input;
}

export const PARAM_KEY_SKIP = 'expo_router_skip';

// It starts with "/" to avoid conflicing with normal component ids.
export const SHOULD_SKIP_ID = '/SHOULD_SKIP';

// It starts with "/" to avoid conflicting with normal component ids.
export const LOCATION_ID = '/LOCATION';

// TODO revisit shouldSkip API
export type ShouldSkip = (readonly [
  componentId: string,
  components: readonly [
    path?: boolean, // if we compare path
    keys?: string[], // searchParams keys to compare
  ],
])[];
