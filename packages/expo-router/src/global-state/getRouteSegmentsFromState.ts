import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';
import { warnIfNestedParams } from '../navigationParams';
import type { StrictState } from './getRouteInfoFromState';

/** Collects focused route names without decoding params or serializing a URL. */
export function getRouteSegmentsFromState(state?: StrictState): string[] {
  if (!state) return [];

  const index = 'index' in state ? (state.index ?? 0) : 0;
  let route = state.routes[index]!;
  warnIfNestedParams(route.params);

  if (route.name === NOT_FOUND_ROUTE_NAME || route.name === SITEMAP_ROUTE_NAME) {
    return [route.name];
  }
  if (route.name !== INTERNAL_SLOT_NAME) {
    throw new Error(`Expected the first route to be ${INTERNAL_SLOT_NAME}, but got ${route.name}`);
  }

  const segments: string[] = [];
  state = route.state;
  while (state) {
    route = state.routes['index' in state && state.index ? state.index : 0]!;
    warnIfNestedParams(route.params);

    const routeName = route.name.startsWith('/') ? route.name.slice(1) : route.name;
    segments.push(...routeName.split('/'));
    state = route.state;
  }

  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }
  return segments;
}
