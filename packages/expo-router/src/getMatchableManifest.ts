import { getContextKey } from './matchers';
import { RouteNode, sortRoutes } from './Route';

type MatchableNode = {
  page: string;
  regex: string;
  routeKeys: Record<string, string>;
  namedRegex: string;
};

// Given a nested route tree, return a flattened array of all routes that can be matched.
export function getMatchableManifest(route: RouteNode): MatchableNode[] {
  function getFlatNodes(route: RouteNode): [string, RouteNode][] {
    if (route.children.length) {
      return route.children.map((child) => getFlatNodes(child)).flat();
      // .sort(([, a], [, b]) => sortRoutes(a, b));
    }

    const key = getContextKey(route.contextKey).replace(/\/index$/, '') ?? '/';
    return [[key, route]];
  }

  // TODO: Ensure routes are sorted
  const flat = getFlatNodes(route)
    .sort(([, a], [, b]) => sortRoutes(a, b))
    .reverse();

  return getMatchableManifestForPaths(flat.map(([normalizedRoutePath]) => normalizedRoutePath));
}

export function getMatchableManifestForPaths(paths: string[]) {
  return paths.map((normalizedRoutePath) => {
    const result = getNamedParametrizedRoute(normalizedRoutePath);

    return {
      ...getRouteRegex(normalizedRoutePath),
      namedRegex: `^${result.namedParameterizedRoute}(?:/)?$`,
      routeKeys: result.routeKeys,
    };
  });
}

/**
 * From a normalized route this function generates a regular expression and
 * a corresponding groups object intended to be used to store matching groups
 * from the regular expression.
 */
export function getRouteRegex(normalizedRoute: string): RouteRegex {
  const { parameterizedRoute, groups } = getParametrizedRoute(normalizedRoute);
  return {
    re: new RegExp(`^${parameterizedRoute}(?:/)?$`),
    groups: groups,
  };
}

export interface Group {
  pos: number;
  repeat: boolean;
  optional: boolean;
}

export interface RouteRegex {
  groups: { [groupName: string]: Group };
  re: RegExp;
}

function getParametrizedRoute(route: string) {
  const segments = removeTrailingSlash(route).slice(1).split('/');
  const groups: { [groupName: string]: Group } = {};
  let groupIndex = 1;

  return {
    parameterizedRoute: segments
      .map((segment) => {
        if (/^\[.*\]$/.test(segment)) {
          const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
          groups[key] = { pos: groupIndex++, repeat, optional };
          return repeat ? (optional ? '(?:/(.+?))?' : '/(.+?)') : '/([^/]+?)';
        } else if (/^\(.*\)$/.test(segment)) {
          // Make section optional
          return `(?:/${escapeStringRegexp(segment)})?`;
        } else {
          return `/${escapeStringRegexp(segment)}`;
        }
      })
      .join(''),
    groups,
  };
}

/**
 * Builds a function to generate a minimal routeKey using only a-z and minimal
 * number of characters.
 */
function buildGetSafeRouteKey() {
  let routeKeyCharCode = 97;
  let routeKeyCharLength = 1;

  return () => {
    let routeKey = '';
    for (let i = 0; i < routeKeyCharLength; i++) {
      routeKey += String.fromCharCode(routeKeyCharCode);
      routeKeyCharCode++;

      if (routeKeyCharCode > 122) {
        routeKeyCharLength++;
        routeKeyCharCode = 97;
      }
    }
    return routeKey;
  };
}

function removeTrailingSlash(route: string) {
  return route.replace(/\/$/, '') || '/';
}

function getNamedParametrizedRoute(route: string) {
  const segments = removeTrailingSlash(route).slice(1).split('/');
  const getSafeRouteKey = buildGetSafeRouteKey();
  const routeKeys: { [named: string]: string } = {};
  return {
    namedParameterizedRoute: segments
      .map((segment) => {
        if (/^\[.*\]$/.test(segment)) {
          const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
          // replace any non-word characters since they can break
          // the named regex
          let cleanedKey = key.replace(/\W/g, '');
          let invalidKey = false;

          // check if the key is still invalid and fallback to using a known
          // safe key
          if (cleanedKey.length === 0 || cleanedKey.length > 30) {
            invalidKey = true;
          }
          if (!isNaN(parseInt(cleanedKey.slice(0, 1)))) {
            invalidKey = true;
          }

          if (invalidKey) {
            cleanedKey = getSafeRouteKey();
          }

          routeKeys[cleanedKey] = key;
          return repeat
            ? optional
              ? `(?:/(?<${cleanedKey}>.+?))?`
              : `/(?<${cleanedKey}>.+?)`
            : `/(?<${cleanedKey}>[^/]+?)`;
        } else if (/^\(.*\)$/.test(segment)) {
          // Make section optional
          return `(?:/${escapeStringRegexp(segment)})?`;
        } else {
          return `/${escapeStringRegexp(segment)}`;
        }
      })
      .join(''),
    routeKeys,
  };
}

// regexp is based on https://github.com/sindresorhus/escape-string-regexp
const reHasRegExp = /[|\\{}()[\]^$+*?.-]/;
const reReplaceRegExp = /[|\\{}()[\]^$+*?.-]/g;

export function escapeStringRegexp(str: string) {
  // see also: https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/escapeRegExp.js#L23
  if (reHasRegExp.test(str)) {
    return str.replace(reReplaceRegExp, '\\$&');
  }
  return str;
}

/**
 * Parses a given parameter from a route to a data structure that can be used
 * to generate the parametrized route. Examples:
 *   - `[...slug]` -> `{ name: 'slug', repeat: true, optional: true }`
 *   - `[foo]` -> `{ name: 'foo', repeat: false, optional: true }`
 *   - `bar` -> `{ name: 'bar', repeat: false, optional: false }`
 */
function parseParameter(param: string) {
  const optional = /^\[.*\]$/.test(param);
  if (optional) {
    param = param.slice(1, -1);
  }
  const repeat = param.startsWith('...');
  if (repeat) {
    param = param.slice(3);
  }
  return { key: param, repeat, optional };
}
