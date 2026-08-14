import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';
import { appendBaseUrl } from '../fork/getPathFromState-forks';
import { warnIfNestedParams, warnIfScreenParam } from '../navigationParams';
import type { NavigationState, PartialState } from '../react-navigation/native';
import { safeDecodeURIComponent } from '../utils/url';
import type { FocusedRouteState } from './types';

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
    params?: object;
    path?: string;
    state?: StrictState;
  }[];
};

export function getRouteInfoFromState(state?: StrictState): UrlObject {
  if (!state) return defaultRouteInfo;

  // TODO(@kitten): Review edge-case type safety
  const index = 'index' in state ? (state.index ?? 0) : 0;
  let route = state.routes[index]!;
  warnIfScreenParam(route.params);
  warnIfNestedParams(route.params);

  if (route.name === NOT_FOUND_ROUTE_NAME || route.name === SITEMAP_ROUTE_NAME) {
    const path = route.path || (route.name === NOT_FOUND_ROUTE_NAME ? '/' : `/${route.name}`);
    return {
      ...defaultRouteInfo,
      unstable_globalHref: appendBaseUrl(path),
      pathname: path,
      pathnameWithParams: path,
      segments: [route.name],
    };
  }

  if (route.name !== INTERNAL_SLOT_NAME) {
    throw new Error(`Expected the first route to be ${INTERNAL_SLOT_NAME}, but got ${route.name}`);
  }

  state = route.state;

  const segments: string[] = [];
  let params: Record<string, unknown> = Object.create(null);

  while (state) {
    route = state.routes['index' in state && state.index ? state.index : 0]!;
    warnIfScreenParam(route.params);
    warnIfNestedParams(route.params);

    Object.assign(params, route.params);

    let routeName = route.name;
    if (routeName.startsWith('/')) {
      routeName = routeName.slice(1);
    }

    segments.push(...routeName.split('/'));
    state = route.state;
  }

  params = Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, safeDecodeURIComponent(value)];
      } else if (Array.isArray(value)) {
        return [key, value.map((v) => (typeof v === 'string' ? safeDecodeURIComponent(v) : v))];
      } else {
        return [key, value];
      }
    })
  );

  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }

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
            return notFoundPath.map(String);
          } else {
            return [String(notFoundPath)];
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
          return Array.isArray(values) ? values.map(String) : values ? [String(values)] : [];
        } else if (segment.startsWith('[') && segment.endsWith(']')) {
          const paramName = segment.slice(1, -1);
          const value = params[paramName];
          pathParams.add(paramName);

          // Optional params are optional
          return value ? [String(value)] : [];
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
        return value.map((v) => [key, String(v)]);
      }
      return [[key, String(value)]];
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
    // Navigation params can contain ordinary object values at runtime despite the public search-param type.
    // TODO: address this together with other params serialization issues
    params: params as UrlObject['params'],
    unstable_globalHref: appendBaseUrl(pathnameWithParams),
    searchParams,
    pathnameWithParams,
    // TODO: Remove this, it is not used anywhere
    isIndex: false,
  };
}
