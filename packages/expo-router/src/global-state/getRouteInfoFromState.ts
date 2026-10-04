import isEqual from 'react-fast-compare';

import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';
import { appendBaseUrl } from '../fork/getPathFromState-forks';
import { warnIfNestedParams } from '../navigationParams';
import { isArrayEqual } from '../react-navigation/core/isArrayEqual';
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

export function areUrlObjectsEqual(a: UrlObject, b: UrlObject): boolean {
  return (
    a.pathname === b.pathname &&
    a.pathnameWithParams === b.pathnameWithParams &&
    a.unstable_globalHref === b.unstable_globalHref &&
    isArrayEqual(a.segments, b.segments) &&
    isEqual(a.params, b.params)
  );
}

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

  const index = 'index' in state ? (state.index ?? 0) : 0;
  const route = state.routes[index]!;
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

  const { segments, params: mergedParams } = collectRouteState(route.state);
  const params = decodeParams(mergedParams);
  const { pathname, pathParams } = resolvePathname(segments, params);
  const { searchParams, pathnameWithParams } = serializeQueryAndHash(pathname, params, pathParams);

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

function collectRouteState(state?: StrictState) {
  const segments: string[] = [];
  const params: Record<string, unknown> = Object.create(null);

  while (state) {
    const route = state.routes['index' in state && state.index ? state.index : 0]!;
    warnIfNestedParams(route.params);

    Object.assign(params, route.params);

    let routeName = route.name;
    if (routeName.startsWith('/')) {
      routeName = routeName.slice(1);
    }

    segments.push(...routeName.split('/'));
    state = route.state;
  }

  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }

  return { segments, params };
}

function decodeParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
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
}

function resolvePathname(segments: readonly string[], params: Record<string, unknown>) {
  const resolvedSegments = segments
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .map((segment): { parts: string[]; paramName?: string } => {
      if (segment === '+not-found') {
        const notFoundPath = params['not-found'];

        if (typeof notFoundPath === 'undefined') {
          // Not founds are optional, do nothing if its not present
          return { parts: [], paramName: 'not-found' };
        } else if (Array.isArray(notFoundPath)) {
          return { parts: notFoundPath.map(String), paramName: 'not-found' };
        } else {
          return { parts: [String(notFoundPath)], paramName: 'not-found' };
        }
      } else if (segment.startsWith('[...') && segment.endsWith(']')) {
        let paramName = segment.slice(4, -1);

        // Legacy for React Navigation optional params
        if (paramName.endsWith('?')) {
          paramName = paramName.slice(0, -1);
        }

        const values = params[paramName];

        // Catchall params are optional
        const parts = Array.isArray(values)
          ? values.filter(isSerializableParam).map(String)
          : isSerializableParam(values) && values
            ? [String(values)]
            : [];
        return { parts, paramName };
      } else if (segment.startsWith('[') && segment.endsWith(']')) {
        const paramName = segment.slice(1, -1);
        const value = params[paramName];

        // Optional params are optional
        return {
          parts: isSerializableParam(value) && value ? [String(value)] : [],
          paramName,
        };
      } else {
        return { parts: [segment] };
      }
    });

  const pathname = '/' + resolvedSegments.flatMap(({ parts }) => parts).join('/');
  const pathParams = new Set(
    resolvedSegments
      .map(({ paramName }) => paramName)
      .filter((paramName): paramName is string => paramName !== undefined)
  );

  return { pathname, pathParams };
}

function serializeQueryAndHash(
  pathname: string,
  params: Record<string, unknown>,
  pathParams: Set<string>
) {
  const searchParams = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => {
      // Search params should not include path params
      if (pathParams.has(key)) {
        return [];
      } else if (Array.isArray(value)) {
        return value.filter(isSerializableParam).map((v) => [key, String(v)]);
      } else if (!isSerializableParam(value)) {
        return [];
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

  return { searchParams, pathnameWithParams };
}

function isSerializableParam(value: unknown): boolean {
  return value == null || typeof value !== 'object';
}
