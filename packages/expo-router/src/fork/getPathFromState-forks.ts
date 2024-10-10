import { validatePathConfig as RNValidatePathConfig, type Route } from '@react-navigation/native';
import * as queryString from 'query-string';

import type { Options, State, StringifyConfig } from './getPathFromState';
import { matchDeepDynamicRouteName, matchDynamicName, matchGroupName } from '../matchers';

export type ExpoOptions = {
  preserveDynamicRoutes?: boolean;
  preserveGroups?: boolean;
  shouldEncodeURISegment?: boolean;
};

export type ExpoConfigItem = {
  // Used as fallback for groups
  initialRouteName?: string;
};

export function validatePathConfig<ParamList extends object>({
  preserveDynamicRoutes,
  preserveGroups,
  shouldEncodeURISegment,
  ...options
}: Options<ParamList>) {
  RNValidatePathConfig(options);
}

export function fixCurrentParams(
  allParams: Record<string, any>,
  route: Route<string> & {
    state?: State;
  },
  stringify?: StringifyConfig
) {
  // Better handle array params
  const currentParams = Object.fromEntries(
    Object.entries(route.params!).flatMap(([key, value]) => {
      if (key === 'screen' || key === 'params') {
        return [];
      }

      return [
        [
          key,
          stringify?.[key]
            ? stringify[key](value)
            : Array.isArray(value)
              ? value.map(String)
              : String(value),
        ],
      ];
    })
  );

  // We always assign params, as non pattern routes may still have query params
  Object.assign(allParams, currentParams);

  return currentParams;
}

export function appendQueryAndHash(
  path: string,
  { '#': hash, ...focusedParams }: Record<string, any>
) {
  const query = queryString.stringify(focusedParams, { sort: false });

  if (query) {
    path += `?${query}`;
  }

  if (hash) {
    path += `#${hash}`;
  }

  return path;
}

export function appendBaseUrl(
  path: string,
  baseUrl: string | undefined = process.env.EXPO_BASE_URL
) {
  if (process.env.NODE_ENV !== 'development') {
    if (baseUrl) {
      return `/${baseUrl.replace(/^\/+/, '').replace(/\/$/, '')}${path}`;
    }
  }

  return path;
}

export function getPathWithConventionsCollapsed({
  pattern,
  route,
  params,
  preserveGroups,
  preserveDynamicRoutes,
  shouldEncodeURISegment = true,
  initialRouteName,
}: ExpoOptions & {
  pattern: string;
  route: Route<any>;
  params: Record<string, any>;
  initialRouteName?: string;
}) {
  const segments = pattern.split('/');

  // console.log({ segments, params });
  return segments
    .map((p, i) => {
      const name = getParamName(p);

      // Showing the route name seems ok, though whatever we show here will be incorrect
      // Since the page doesn't actually exist
      if (p.startsWith('*')) {
        if (preserveDynamicRoutes) {
          if (name === 'not-found') {
            return '+not-found';
          }

          return `[...${name}]`;
        } else if (params[name]) {
          if (Array.isArray(params[name])) {
            return params[name].join('/');
          }
          return params[name];
        } else if (route.name.startsWith('[') && route.name.endsWith(']')) {
          return '';
        } else if (p === '*not-found') {
          return '';
        } else {
          return route.name;
        }
      }

      // If the path has a pattern for a param, put the param in the path
      if (p.startsWith(':')) {
        if (preserveDynamicRoutes) {
          return `[${name}]`;
        }
        // Optional params without value assigned in route.params should be ignored
        const value = params[name];
        if (value === undefined && p.endsWith('?')) {
          return;
        }

        return (shouldEncodeURISegment ? encodeURISegment(value) : value) ?? 'undefined';
      }

      if (!preserveGroups && matchGroupName(p) != null) {
        // When the last part is a group it could be a shared URL
        // if the route has an initialRouteName defined, then we should
        // use that as the component path as we can assume it will be shown.
        if (segments.length - 1 === i) {
          if (initialRouteName) {
            // Return an empty string if the init route is ambiguous.
            if (segmentMatchesConvention(initialRouteName)) {
              return '';
            }
            return shouldEncodeURISegment
              ? encodeURISegment(initialRouteName, { preserveBrackets: true })
              : initialRouteName;
          }
        }
        return '';
      }
      // Preserve dynamic syntax for rehydration
      return shouldEncodeURISegment ? encodeURISegment(p, { preserveBrackets: true }) : p;
    })
    .map((v) => v ?? '')
    .join('/');
}

export const getParamName = (pattern: string) => pattern.replace(/^[:*]/, '').replace(/\?$/, '');

export function isDynamicPart(p: string) {
  return p.startsWith(':') || p.startsWith('*');
}

function segmentMatchesConvention(segment: string): boolean {
  return (
    segment === 'index' ||
    matchDynamicName(segment) != null ||
    matchGroupName(segment) != null ||
    matchDeepDynamicRouteName(segment) != null
  );
}

function encodeURISegment(str: string, { preserveBrackets = false } = {}) {
  // Valid characters according to
  // https://datatracker.ietf.org/doc/html/rfc3986#section-3.3 (see pchar definition)
  str = String(str).replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]/g, (char) => encodeURIComponent(char));

  if (preserveBrackets) {
    // Preserve brackets
    str = str.replace(/%5B/g, '[').replace(/%5D/g, ']');
  }
  return str;
}
