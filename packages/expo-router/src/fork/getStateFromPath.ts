import { PathConfigMap } from '@react-navigation/core';
import type { InitialState, NavigationState, PartialState } from '@react-navigation/routers';
import escape from 'escape-string-regexp';
import * as queryString from 'query-string';
import URL from 'url-parse';

import { RouteNode } from '../Route';
import { matchGroupName, stripGroupSegmentsFromPath } from '../matchers';
import { findFocusedRoute } from './findFocusedRoute';
import validatePathConfig from './validatePathConfig';

type Options<ParamList extends object> = {
  initialRouteName?: string;
  screens: PathConfigMap<ParamList>;
};

type ParseConfig = Record<string, (value: string) => any>;

type RouteConfig = {
  isInitial?: boolean;
  screen: string;
  regex?: RegExp;
  path: string;
  pattern: string;
  routeNames: string[];
  parse?: ParseConfig;
  hasChildren: boolean;
  userReadableName: string;
  _route?: RouteNode;
};

type InitialRouteConfig = {
  initialRouteName: string;
  parentScreens: string[];
};

export type ResultState = PartialState<NavigationState> & {
  state?: ResultState;
};

type ParsedRoute = {
  name: string;
  path?: string;
  params?: Record<string, any> | undefined;
};

export function getUrlWithReactNavigationConcessions(path: string) {
  const parsed = new URL(path, 'https://acme.com');
  const pathname = parsed.pathname;

  // Make sure there is a trailing slash
  return {
    // The slashes are at the end, not the beginning
    nonstandardPathname: pathname.replace(/^\/+/g, '').replace(/\/+$/g, '') + '/',
    // React Navigation doesn't support hashes, so here
    inputPathnameWithoutHash: path.replace(/#.*$/, ''),
  };
}

/**
 * Utility to parse a path string to initial state object accepted by the container.
 * This is useful for deep linking when we need to handle the incoming URL.
 *
 * @example
 * ```js
 * getStateFromPath(
 *   '/chat/jane/42',
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         parse: { id: Number }
 *       }
 *     }
 *   }
 * )
 * ```
 * @param path Path string to parse and convert, e.g. /foo/bar?count=42.
 * @param options Extra options to fine-tune how to parse the path.
 */
export default function getStateFromPath<ParamList extends object>(
  path: string,
  options?: Options<ParamList>
): ResultState | undefined {
  const { initialRoutes, configs } = getMatchableRouteConfigs(options);

  return getStateFromPathWithConfigs(path, configs, initialRoutes);
}

export function getMatchableRouteConfigs<ParamList extends object>(options?: Options<ParamList>) {
  if (options) {
    validatePathConfig(options);
  }

  const screens = options?.screens;
  // Expo Router disallows usage without a linking config.
  if (!screens) {
    throw Error("You must pass a 'screens' object to 'getStateFromPath' to generate a path.");
  }

  // This will be mutated...
  const initialRoutes: InitialRouteConfig[] = [];

  if (options?.initialRouteName) {
    initialRoutes.push({
      initialRouteName: options.initialRouteName,
      parentScreens: [],
    });
  }

  // Create a normalized configs array which will be easier to use.
  const converted = Object.keys(screens)
    .map((key) => createNormalizedConfigs(key, screens, [], initialRoutes))
    .flat();

  const resolvedInitialPatterns = initialRoutes.map((route) =>
    joinPaths(...route.parentScreens, route.initialRouteName)
  );

  const convertedWithInitial = converted.map((config) => ({
    ...config,
    // TODO(EvanBacon): Probably a safer way to do this
    // Mark initial routes to give them potential priority over other routes that match.
    isInitial: resolvedInitialPatterns.includes(config.routeNames.join('/')),
  }));

  // Sort in order of resolution. This is extremely important for the algorithm to work.
  const configs = convertedWithInitial.sort(sortConfigs);

  // Assert any duplicates before we start parsing.
  assertConfigDuplicates(configs);

  return { configs, initialRoutes };
}

function assertConfigDuplicates(configs: RouteConfig[]) {
  // Check for duplicate patterns in the config
  configs.reduce<Record<string, RouteConfig>>((acc, config) => {
    // NOTE(EvanBacon): Uses the regex pattern as key to detect duplicate slugs.
    const indexedKey = config.regex?.toString() ?? config.pattern;
    const alpha = acc[indexedKey];
    // NOTE(EvanBacon): Skips checking nodes that have children.
    if (alpha && !alpha.hasChildren && !config.hasChildren) {
      const a = alpha.routeNames;
      const b = config.routeNames;

      // It's not a problem if the path string omitted from a inner most screen
      // For example, it's ok if a path resolves to `A > B > C` or `A > B`
      const intersects =
        a.length > b.length ? b.every((it, i) => a[i] === it) : a.every((it, i) => b[i] === it);

      if (!intersects) {
        // NOTE(EvanBacon): Adds more context to the error message since we know about the
        // file-based routing.
        const last = config.pattern.split('/').pop();
        const routeType = last?.startsWith(':')
          ? 'dynamic route'
          : last?.startsWith('*')
          ? 'dynamic-rest route'
          : 'route';
        throw new Error(
          `The ${routeType} pattern '${config.pattern || '/'}' resolves to both '${
            alpha.userReadableName
          }' and '${
            config.userReadableName
          }'. Patterns must be unique and cannot resolve to more than one route.`
        );
      }
    }

    return Object.assign(acc, {
      [indexedKey]: config,
    });
  }, {});
}

function sortConfigs(a: RouteConfig, b: RouteConfig): number {
  // Sort config so that:
  // - the most exhaustive ones are always at the beginning
  // - patterns with wildcard are always at the end

  // If 2 patterns are same, move the one with less route names up
  // This is an error state, so it's only useful for consistent error messages
  if (a.pattern === b.pattern) {
    return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
  }

  // If one of the patterns starts with the other, it's more exhaustive
  // So move it up
  if (
    a.pattern.startsWith(b.pattern) &&
    // NOTE(EvanBacon): This is a hack to make sure that `*` is always at the end
    b.screen !== 'index'
  ) {
    return -1;
  }

  if (b.pattern.startsWith(a.pattern) && a.screen !== 'index') {
    return 1;
  }

  // NOTE(EvanBacon): Here we append `index` if the screen was `index` so the length is the same
  // as a slug or wildcard when nested more than one level deep.
  // This is so we can compare the length of the pattern, e.g. `foo/*` > `foo` vs `*` < ``.
  const aParts = a.pattern
    .split('/')
    // Strip out group names to ensure they don't affect the priority.
    .filter((part) => matchGroupName(part) == null);
  if (a.screen === 'index') {
    aParts.push('index');
  }

  const bParts = b.pattern.split('/').filter((part) => matchGroupName(part) == null);
  if (b.screen === 'index') {
    bParts.push('index');
  }

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    // if b is longer, b get higher priority
    if (aParts[i] == null) {
      return 1;
    }
    // if a is longer, a get higher priority
    if (bParts[i] == null) {
      return -1;
    }
    const aWildCard = aParts[i].startsWith('*');
    const bWildCard = bParts[i].startsWith('*');
    // if both are wildcard we compare next component
    if (aWildCard && bWildCard) {
      continue;
    }
    // if only a is wild card, b get higher priority
    if (aWildCard) {
      return 1;
    }
    // if only b is wild card, a get higher priority
    if (bWildCard) {
      return -1;
    }

    const aSlug = aParts[i].startsWith(':');
    const bSlug = bParts[i].startsWith(':');
    // if both are wildcard we compare next component
    if (aSlug && bSlug) {
      continue;
    }
    // if only a is wild card, b get higher priority
    if (aSlug) {
      return 1;
    }
    // if only b is wild card, a get higher priority
    if (bSlug) {
      return -1;
    }
  }

  // Sort initial routes with a higher priority than routes which will push more screens
  // this ensures shared routes go to the shortest path.
  if (a.isInitial && !b.isInitial) {
    return -1;
  }
  if (!a.isInitial && b.isInitial) {
    return 1;
  }

  return bParts.length - aParts.length;
}

function getStateFromEmptyPathWithConfigs(
  path: string,
  configs: RouteConfig[],
  initialRoutes: InitialRouteConfig[]
): ResultState | undefined {
  // We need to add special handling of empty path so navigation to empty path also works
  // When handling empty path, we should only look at the root level config

  // NOTE(EvanBacon): We only care about matching leaf nodes.
  const leafNodes = configs
    .filter((config) => !config.hasChildren)
    .map((value) => {
      return {
        ...value,
        // Collapse all levels of group segments before testing.
        // This enables `app/(one)/(two)/index.js` to be matched.
        path: stripGroupSegmentsFromPath(value.path),
      };
    });

  const match =
    leafNodes.find(
      (config) =>
        // NOTE(EvanBacon): Test leaf node index routes that either don't have a regex or match an empty string.
        config.path === '' && (!config.regex || config.regex.test(''))
    ) ??
    leafNodes.find(
      (config) =>
        // NOTE(EvanBacon): Test leaf node dynamic routes that match an empty string.
        config.path.startsWith(':') && config.regex!.test('')
    ) ??
    // NOTE(EvanBacon): Test leaf node deep dynamic routes that match a slash.
    // This should be done last to enable dynamic routes having a higher priority.
    leafNodes.find((config) => config.path.startsWith('*') && config.regex!.test('/'));

  if (!match) {
    return undefined;
  }

  const routes = match.routeNames.map((name) => {
    if (!match._route) {
      return { name };
    }
    return {
      name,
      _route: match._route,
    };
  });

  return createNestedStateObject(path, routes, configs, initialRoutes);
}

function getStateFromPathWithConfigs(
  path: string,
  configs: RouteConfig[],
  initialRoutes: InitialRouteConfig[]
): ResultState | undefined {
  const formattedPaths = getUrlWithReactNavigationConcessions(path);

  if (formattedPaths.nonstandardPathname === '/') {
    return getStateFromEmptyPathWithConfigs(
      formattedPaths.inputPathnameWithoutHash,
      configs,
      initialRoutes
    );
  }

  // We match the whole path against the regex instead of segments
  // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
  const routes = matchAgainstConfigs(formattedPaths.nonstandardPathname, configs);

  if (routes == null) {
    return undefined;
  }
  // This will always be empty if full path matched
  return createNestedStateObject(
    formattedPaths.inputPathnameWithoutHash,
    routes,
    configs,
    initialRoutes
  );
}

const joinPaths = (...paths: string[]): string =>
  ([] as string[])
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');

function matchAgainstConfigs(remaining: string, configs: RouteConfig[]): ParsedRoute[] | undefined {
  let routes: ParsedRoute[] | undefined;
  let remainingPath = remaining;

  // Go through all configs, and see if the next path segment matches our regex
  for (const config of configs) {
    if (!config.regex) {
      continue;
    }

    const match = remainingPath.match(config.regex);

    // If our regex matches, we need to extract params from the path
    if (!match) {
      continue;
    }

    // TODO: Add support for wildcard routes
    const matchedParams = config.pattern
      ?.split('/')
      .filter((p) => p.match(/^[:*]/))
      .reduce<Record<string, any>>((acc, p, i) => {
        if (p.match(/^\*/)) {
          return {
            ...acc,
            [p]: match![(i + 1) * 2], //?.replace(/\//, ""),
          };
        }
        return Object.assign(acc, {
          // The param segments appear every second item starting from 2 in the regex match result.
          // This will only work if we ensure groups aren't included in the match.
          [p]: match![(i + 1) * 2]?.replace(/\//, ''),
        });
      }, {});

    const routeFromName = (name: string) => {
      const config = configs.find((c) => c.screen === name);
      if (!config?.path) {
        return { name };
      }

      const segments = config.path.split('/');

      const params: Record<string, any> = {};

      segments
        .filter((p) => p.match(/^[:*]/))
        .forEach((p) => {
          let value = matchedParams[p];
          if (value) {
            if (p.match(/^\*/)) {
              // Convert to an array before providing as a route.
              value = value?.split('/').filter(Boolean);
            }

            const key = p.replace(/^[:*]/, '').replace(/\?$/, '');
            params[key] = config.parse?.[key] ? config.parse[key](value) : value;
          }
        });

      if (params && Object.keys(params).length) {
        return { name, params };
      }

      return { name };
    };

    routes = config.routeNames.map((name) => {
      if (!config._route) {
        return { ...routeFromName(name) };
      }
      return {
        ...routeFromName(name),
        _route: config._route,
      };
    });

    // TODO(EvanBacon): Maybe we should warn / assert if multiple slugs use the same param name.
    const combinedParams = routes.reduce<Record<string, any>>(
      (acc, r) => Object.assign(acc, r.params),
      {}
    );

    const hasCombinedParams = Object.keys(combinedParams).length > 0;

    // Combine all params so a route `[foo]/[bar]/other.js` has access to `{ foo, bar }`
    routes = routes.map((r) => {
      if (hasCombinedParams) {
        r.params = combinedParams;
      }
      return r;
    });

    remainingPath = remainingPath.replace(match[1], '');

    break;
  }

  return routes;
}

function equalHeritage(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].localeCompare(b[i]) !== 0) {
      return false;
    }
  }
  return true;
}

const createNormalizedConfigs = (
  screen: string,
  routeConfig: PathConfigMap<object>,
  routeNames: string[] = [],
  initials: InitialRouteConfig[] = [],
  parentScreens: string[] = [],
  parentPattern?: string
): RouteConfig[] => {
  const configs: RouteConfig[] = [];

  routeNames.push(screen);

  parentScreens.push(screen);

  const config = (routeConfig as any)[screen];

  if (typeof config === 'string') {
    // TODO: This should never happen with the addition of `_route`

    // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
    const pattern = parentPattern ? joinPaths(parentPattern, config) : config;

    configs.push(createConfigItem(screen, routeNames, pattern, config, false));
  } else if (typeof config === 'object') {
    let pattern: string | undefined;

    const { _route } = config;
    // if an object is specified as the value (e.g. Foo: { ... }),
    // it can have `path` property and
    // it could have `screens` prop which has nested configs
    if (typeof config.path === 'string') {
      if (config.exact && config.path === undefined) {
        throw new Error(
          "A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`."
        );
      }

      pattern =
        config.exact !== true
          ? joinPaths(parentPattern || '', config.path || '')
          : config.path || '';

      configs.push(
        createConfigItem(
          screen,
          routeNames,
          pattern!,
          config.path,
          config.screens ? !!Object.keys(config.screens)?.length : false,
          config.parse,
          _route
        )
      );
    }

    if (config.screens) {
      // property `initialRouteName` without `screens` has no purpose
      if (config.initialRouteName) {
        initials.push({
          initialRouteName: config.initialRouteName,
          parentScreens,
        });
      }

      Object.keys(config.screens).forEach((nestedConfig) => {
        const result = createNormalizedConfigs(
          nestedConfig,
          config.screens as PathConfigMap<object>,
          routeNames,
          initials,
          [...parentScreens],
          pattern ?? parentPattern
        );

        configs.push(...result);
      });
    }
  }

  routeNames.pop();

  return configs;
};

function formatRegexPattern(it: string): string {
  // Allow spaces in file path names.
  it = it.replace(' ', '%20');

  if (it.startsWith(':')) {
    // TODO: Remove unused match group
    return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
  } else if (it.startsWith('*')) {
    return `((.*\\/)${it.endsWith('?') ? '?' : ''})`;
  }

  // Strip groups from the matcher
  if (matchGroupName(it) != null) {
    // Groups are optional segments
    // this enables us to match `/bar` and `/(foo)/bar` for the same route
    // NOTE(EvanBacon): Ignore this match in the regex to avoid capturing the group
    return `(?:${escape(it)}\\/)?`;
  }

  return escape(it) + `\\/`;
}

const createConfigItem = (
  screen: string,
  routeNames: string[],
  pattern: string,
  path: string,
  hasChildren?: boolean,
  parse?: ParseConfig,
  _route?: any
): RouteConfig => {
  // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
  pattern = pattern.split('/').filter(Boolean).join('/');

  const regex = pattern
    ? new RegExp(`^(${pattern.split('/').map(formatRegexPattern).join('')})$`)
    : undefined;

  return {
    screen,
    regex,
    pattern,
    path,
    // The routeNames array is mutated, so copy it to keep the current state
    routeNames: [...routeNames],
    parse,
    userReadableName: [...routeNames.slice(0, -1), path || screen].join('/'),
    hasChildren: !!hasChildren,
    _route,
  };
};

const findParseConfigForRoute = (
  routeName: string,
  routeConfigs: RouteConfig[]
): ParseConfig | undefined => {
  for (const config of routeConfigs) {
    if (routeName === config.routeNames[config.routeNames.length - 1]) {
      return config.parse;
    }
  }

  return undefined;
};

// Try to find an initial route connected with the one passed
const findInitialRoute = (
  routeName: string,
  parentScreens: string[],
  initialRoutes: InitialRouteConfig[]
): string | undefined => {
  for (const config of initialRoutes) {
    if (equalHeritage(parentScreens, config.parentScreens)) {
      // If the parents are the same but the route name doesn't match the initial route
      // then we return the initial route.
      return routeName !== config.initialRouteName ? config.initialRouteName : undefined;
    }
  }
  return undefined;
};

// returns state object with values depending on whether
// it is the end of state and if there is initialRoute for this level
const createStateObject = (
  initialRoute: string | undefined,
  route: ParsedRoute,
  isEmpty: boolean
): InitialState => {
  if (isEmpty) {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{ name: initialRoute }, route],
      };
    }
    return {
      routes: [route],
    };
  }

  if (initialRoute) {
    return {
      index: 1,
      routes: [{ name: initialRoute }, { ...route, state: { routes: [] } }],
    };
  }
  return {
    routes: [{ ...route, state: { routes: [] } }],
  };
};

const createNestedStateObject = (
  path: string,
  routes: ParsedRoute[],
  routeConfigs: RouteConfig[],
  initialRoutes: InitialRouteConfig[]
) => {
  let route = routes.shift() as ParsedRoute;
  const parentScreens: string[] = [];

  let initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);

  parentScreens.push(route.name);

  const state: InitialState = createStateObject(initialRoute, route, routes.length === 0);

  if (routes.length > 0) {
    let nestedState = state;

    while ((route = routes.shift() as ParsedRoute)) {
      initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);

      const nestedStateIndex = nestedState.index || nestedState.routes.length - 1;

      nestedState.routes[nestedStateIndex].state = createStateObject(
        initialRoute,
        route,
        routes.length === 0
      );

      if (routes.length > 0) {
        nestedState = nestedState.routes[nestedStateIndex].state as InitialState;
      }

      parentScreens.push(route.name);
    }
  }

  route = findFocusedRoute(state) as ParsedRoute;

  // Remove groups from the path while preserving a trailing slash.
  route.path = stripGroupSegmentsFromPath(path);

  const params = parseQueryParams(route.path, findParseConfigForRoute(route.name, routeConfigs));

  if (params) {
    const resolvedParams = { ...route.params, ...params };
    if (Object.keys(resolvedParams).length > 0) {
      route.params = resolvedParams;
    } else {
      delete route.params;
    }
  }

  return state;
};

const parseQueryParams = (path: string, parseConfig?: Record<string, (value: string) => any>) => {
  const query = path.split('?')[1];
  const params = queryString.parse(query);

  if (parseConfig) {
    Object.keys(params).forEach((name) => {
      if (Object.hasOwnProperty.call(parseConfig, name) && typeof params[name] === 'string') {
        params[name] = parseConfig[name](params[name] as string);
      }
    });
  }

  return Object.keys(params).length ? params : undefined;
};
