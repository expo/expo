import type { NavigationState, PartialState } from '@react-navigation/native';

import type { FocusedRouteState } from './router-store';
import { INTERNAL_SLOT_NAME } from '../constants';
import { appendBaseUrl } from '../fork/getPathFromState-forks';

export type UrlObject = {
  unstable_globalHref: string;
  pathname: string;
  readonly params: Record<string, string | string[]>;
  searchParams: URLSearchParams;
  segments: string[];
  pathnameWithParams: string;
  isIndex: boolean;
};

export const defaultRouteInfo: UrlObject = {
  unstable_globalHref: '',
  searchParams: new URLSearchParams(),
  pathname: '/',
  params: {},
  segments: [],
  pathnameWithParams: '/',
  // TODO: Remove this, it is not used anywhere
  isIndex: false,
};

/**
 * A better typed version of `FocusedRouteState` that is easier to parse
 */
type StrictState = (FocusedRouteState | NavigationState | PartialState<NavigationState>) & {
  routes: {
    key?: string;
    name: string;
    params?: StrictFocusedRouteParams;
    path?: string;
    state?: StrictState;
  }[];
};

type StrictFocusedRouteParams =
  | Record<string, string | string[]>
  | {
      screen?: string;
      params?: StrictFocusedRouteParams;
    };

export function getRouteInfoFromState(state?: StrictState): UrlObject {
  if (!state) return defaultRouteInfo;

  let route = state.routes[0];
  if (route.name !== INTERNAL_SLOT_NAME) {
    throw new Error(`Expected the first route to be ${INTERNAL_SLOT_NAME}, but got ${route.name}`);
  }

  state = route.state;

  const segments: string[] = [];
  const params: UrlObject['params'] = Object.create(null);

  while (state) {
    route = state.routes['index' in state && state.index ? state.index : 0];

    Object.assign(params, route.params);

    let routeName = route.name;
    if (routeName.startsWith('/')) {
      routeName = routeName.slice(1);
    }

    segments.push(...routeName.split('/'));
    state = route.state;
  }

  /**
   * If React Navigation didn't render the entire tree (e.g it was interrupted in a layout)
   * then the state maybe incomplete. The reset of the path is in the params, instead of being a route
   */
  let routeParams: StrictFocusedRouteParams | undefined = route.params;
  while (routeParams && 'screen' in routeParams) {
    if (typeof routeParams.screen === 'string') {
      const screen = routeParams.screen.startsWith('/')
        ? routeParams.screen.slice(1)
        : routeParams.screen;
      segments.push(...screen.split('/'));
    }

    if (typeof routeParams.params === 'object' && !Array.isArray(routeParams.params)) {
      routeParams = routeParams.params;
    } else {
      routeParams = undefined;
    }
  }

  if (route.params && 'screen' in route.params && route.params.screen === 'string') {
    const screen = route.params.screen.startsWith('/')
      ? route.params.screen.slice(1)
      : route.params.screen;
    segments.push(...screen.split('/'));
  }

  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }

  delete params['screen'];
  delete params['params'];

  const pathParams = new Set<string>();

  const pathname =
    '/' +
    segments
      .filter((segment) => {
        return !(segment.startsWith('(') && segment.endsWith(')'));
      })
      .flatMap((segment) => {
        if (segment === '+not-found') {
          const notFoundPath = params['not-found'];

          pathParams.add('not-found');

          if (typeof notFoundPath === 'undefined') {
            // Not founds are optional, do nothing if its not present
            return [];
          } else if (Array.isArray(notFoundPath)) {
            return notFoundPath;
          } else {
            return [notFoundPath];
          }
        } else if (segment.startsWith('[...') && segment.endsWith(']')) {
          let paramName = segment.slice(4, -1);

          // Legacy for React Navigation optional params
          if (paramName.endsWith('?')) {
            paramName = paramName.slice(0, -1);
          }

          const values = params[paramName];
          pathParams.add(paramName);

          // Catchall params are optional
          return values || [];
        } else if (segment.startsWith('[') && segment.endsWith(']')) {
          const paramName = segment.slice(1, -1);
          const value = params[paramName];
          pathParams.add(paramName);

          // Optional params are optional
          return value ? [value] : [];
        } else {
          return [segment];
        }
      })
      .join('/');

  const searchParams = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => {
      // Search params should not include path params
      if (pathParams.has(key)) {
        return [];
      } else if (Array.isArray(value)) {
        return value.map((v) => [key, v]);
      }
      return [[key, value]];
    })
  );

  let hash: string | undefined;
  if (searchParams.has('#')) {
    hash = searchParams.get('#') || undefined;
    searchParams.delete('#');
  }

  // We cannot use searchParams.size because it is not included in the React Native polyfill
  const searchParamString = searchParams.toString();
  let pathnameWithParams = searchParamString ? pathname + '?' + searchParamString : pathname;
  pathnameWithParams = hash ? pathnameWithParams + '#' + hash : pathnameWithParams;

  return {
    segments,
    pathname,
    params,
    unstable_globalHref: appendBaseUrl(pathnameWithParams),
    searchParams,
    pathnameWithParams,
    // TODO: Remove this, it is not used anywhere
    isIndex: false,
  };
}
