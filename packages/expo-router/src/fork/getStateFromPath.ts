import escape from 'escape-string-regexp';

import { INTERNAL_SLOT_NAME } from '../constants';
import type { PathConfigMap } from '../react-navigation/native';
import { validatePathConfig } from '../react-navigation/native';
import type { InitialState } from '../react-navigation/routers';
import { getRouteKey, getStateKey } from '../react-navigation/routers/getRouteKey';
import { findFocusedRoute } from './findFocusedRoute';
import type { ExpoOptions, ExpoRouteConfig } from './getStateFromPath-forks';
import * as expo from './getStateFromPath-forks';

export type Options<ParamList extends object> = ExpoOptions & {
  path?: string;
  initialRouteName?: string;
  screens: PathConfigMap<ParamList>;
};

type ParseConfig = Record<string, (value: string) => any>;

export type RouteConfig = ExpoRouteConfig & {
  screen: string;
  regex?: RegExp;
  path: string;
  pattern: string;
  routeNames: string[];
  parse?: ParseConfig;
};

export type InitialRouteConfig = {
  initialRouteName: string;
  parentScreens: string[];
};

// The compiler emits a complete, keyed state: `stale: false`, explicit `index`, full sibling
// `routeNames`, and a `key` on every level and every route — nested down to the leaf. Downstream can
// render it as-is (no rehydration).
export type CompleteResultState = {
  stale: false;
  key: string;
  index: number;
  routeNames: string[];
  routes: CompleteRoute[];
};

export type CompleteRoute = {
  key: string;
  name: string;
  params?: Record<string, any>;
  state?: CompleteResultState;
};

/** @deprecated Superseded by `CompleteResultState`; kept so existing imports keep compiling. */
export type ResultState = CompleteResultState;

export type ParsedRoute = {
  name: string;
  params?: Record<string, any> | undefined;
};

type ConfigResources = {
  initialRoutes: InitialRouteConfig[];
  configs: RouteConfig[];
  configWithRegexes: RouteConfig[];
};

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
export function getStateFromPath<ParamList extends object>(
  path: string,
  options?: Options<ParamList>,
  // START FORK
  segments: string[] = []
  // END FORK
): CompleteResultState | undefined {
  const { initialRoutes, configs, configWithRegexes } = getConfigResources(
    options,
    // START FORK
    segments
    // END FORK
  );

  const screens = options?.screens;

  // START FORK
  const expoPath = expo.getUrlWithReactNavigationConcessions(path);
  // END FORK

  // START FORK
  let remaining = expo.cleanPath(expoPath.nonstandardPathname);
  // let remaining = path
  //   .replace(/\/+/g, '/') // Replace multiple slash (//) with single ones
  //   .replace(/^\//, '') // Remove extra leading slash
  //   .replace(/\?.*$/, ''); // Remove query params which we will handle later

  // // Make sure there is a trailing slash
  // remaining = remaining.endsWith('/') ? remaining : `${remaining}/`;
  // END FORK

  const prefix = options?.path?.replace(/^\//, ''); // Remove extra leading slash

  if (prefix) {
    // Make sure there is a trailing slash
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    // If the path doesn't start with the prefix, it's not a match
    if (!remaining.startsWith(normalizedPrefix)) {
      return undefined;
    }

    // Remove the prefix from the path
    remaining = remaining.replace(normalizedPrefix, '');
  }

  if (screens === undefined) {
    // When no config is specified, use the path segments as route names
    const routes = remaining
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        const name = decodeURIComponent(segment);
        return { name };
      });

    if (routes.length) {
      return createNestedStateObject(expoPath, routes, initialRoutes, undefined, [], expoPath.hash);
    }

    return undefined;
  }

  if (remaining === '/') {
    // We need to add special handling of empty path so navigation to empty path also works
    // When handling empty path, we should only look at the root level config
    // START FORK
    const match = expo.matchForEmptyPath(configWithRegexes);
    // const match = configs.find(
    //   (config) =>
    //     config.path === '' &&
    //     config.routeNames.every(
    //       // Make sure that none of the parent configs have a non-empty path defined
    //       (name) => !configs.find((c) => c.screen === name)?.path
    //     )
    // );
    // END FORK

    if (match) {
      return createNestedStateObject(
        expoPath,
        match.routeNames.map((name) => ({ name })),
        initialRoutes,
        screens,
        configs,
        expoPath.hash
      );
    }

    return undefined;
  }

  let result: CompleteResultState | undefined;
  let current: CompleteResultState | undefined;

  // We match the whole path against the regex instead of segments
  // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
  const { routes, remainingPath } = matchAgainstConfigs(remaining, configWithRegexes);

  if (routes !== undefined) {
    // This will always be empty if full path matched
    current = createNestedStateObject(
      expoPath,
      routes,
      initialRoutes,
      screens,
      configs,
      expoPath.hash
    );
    remaining = remainingPath;
    result = current;
  }

  if (current == null || result == null) {
    return undefined;
  }

  return result;
}

/**
 * Reference to the last used config resources. This is used to avoid recomputing the config resources when the options are the same.
 */
let cachedConfigResources: [Options<object> | undefined, ConfigResources] = [
  undefined,
  prepareConfigResources(),
];

function getConfigResources<ParamList extends object>(
  options: Options<ParamList> | undefined,
  // START FORK
  previousSegments?: string[]
  // END FORK
) {
  // START FORK - We need to disable this caching as our configs can change based upon the current state
  // if (cachedConfigResources[0] !== options) {
  cachedConfigResources = [options, prepareConfigResources(options, previousSegments)];
  // }
  // END FORK FORK

  return cachedConfigResources[1];
}

function prepareConfigResources(options?: Options<object>, previousSegments?: string[]) {
  if (options) {
    validatePathConfig(options);
  }

  const initialRoutes = getInitialRoutes(options);

  const configs = getNormalizedConfigs(initialRoutes, options?.screens, previousSegments);

  checkForDuplicatedConfigs(configs);

  const configWithRegexes = getConfigsWithRegexes(configs);

  return {
    initialRoutes,
    configs,
    configWithRegexes,
  };
}

function getInitialRoutes(options?: Options<object>) {
  const initialRoutes: InitialRouteConfig[] = [];

  if (options?.initialRouteName) {
    initialRoutes.push({
      initialRouteName: options.initialRouteName,
      parentScreens: [],
    });
  }

  return initialRoutes;
}

function getNormalizedConfigs(
  initialRoutes: InitialRouteConfig[],
  screens: PathConfigMap<object> = {},
  // START FORK
  previousSegments?: string[]
  // END FORK
) {
  // Create a normalized configs array which will be easier to use
  return ([] as RouteConfig[])
    .concat(
      ...Object.keys(screens).map((key) =>
        createNormalizedConfigs(key, screens as PathConfigMap<object>, [], initialRoutes, [])
      )
    )
    .map(expo.appendIsInitial(initialRoutes))
    .sort(expo.getRouteConfigSorter(previousSegments));
  // .sort((a, b) => {
  //   // Sort config so that:
  //   // - the most exhaustive ones are always at the beginning
  //   // - patterns with wildcard are always at the end

  //   // If 2 patterns are same, move the one with less route names up
  //   // This is an error state, so it's only useful for consistent error messages
  //   if (a.pattern === b.pattern) {
  //     return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
  //   }

  //   // If one of the patterns starts with the other, it's more exhaustive
  //   // So move it up
  //   if (a.pattern.startsWith(b.pattern)) {
  //     return -1;
  //   }

  //   if (b.pattern.startsWith(a.pattern)) {
  //     return 1;
  //   }

  //   const aParts = a.pattern.split('/');
  //   const bParts = b.pattern.split('/');

  //   for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
  //     // if b is longer, b get higher priority
  //     if (aParts[i] == null) {
  //       return 1;
  //     }
  //     // if a is longer, a get higher priority
  //     if (bParts[i] == null) {
  //       return -1;
  //     }
  //     const aWildCard = aParts[i] === '*' || aParts[i].startsWith(':');
  //     const bWildCard = bParts[i] === '*' || bParts[i].startsWith(':');
  //     // if both are wildcard we compare next component
  //     if (aWildCard && bWildCard) {
  //       continue;
  //     }
  //     // if only a is wild card, b get higher priority
  //     if (aWildCard) {
  //       return 1;
  //     }
  //     // if only b is wild card, a get higher priority
  //     if (bWildCard) {
  //       return -1;
  //     }
  //   }
  //   return bParts.length - aParts.length;
  // });
}

function checkForDuplicatedConfigs(configs: RouteConfig[]) {
  // Check for duplicate patterns in the config
  configs.reduce<Record<string, RouteConfig>>((acc, config) => {
    if (acc[config.pattern]) {
      const a = acc[config.pattern]!.routeNames;
      const b = config.routeNames;

      // It's not a problem if the path string omitted from a inner most screen
      // For example, it's ok if a path resolves to `A > B > C` or `A > B`
      const intersects =
        a.length > b.length ? b.every((it, i) => a[i] === it) : a.every((it, i) => b[i] === it);

      if (!intersects) {
        throw new Error(
          `Found conflicting screens with the same pattern. The pattern '${
            config.pattern
          }' resolves to both '${a.join(' > ')}' and '${b.join(
            ' > '
          )}'. Patterns must be unique and cannot resolve to more than one screen.`
        );
      }
    }

    return Object.assign(acc, {
      [config.pattern]: config,
    });
  }, {});
}

function getConfigsWithRegexes(configs: RouteConfig[]) {
  return configs.map((c) => ({
    ...c,
    // Add `$` to the regex to make sure it matches till end of the path and not just beginning
    // START FORK
    // regex: c.regex ? new RegExp(c.regex.source + '$') : undefined,
    regex: expo.configRegExp(c),
    // END FORK
  }));
}

const joinPaths = (...paths: string[]): string =>
  ([] as string[])
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');

const matchAgainstConfigs = (remaining: string, configs: RouteConfig[]) => {
  let routes: ParsedRoute[] | undefined;
  let remainingPath = remaining;

  // START FORK
  const allParams = Object.create(null);
  // END FORK

  // Go through all configs, and see if the next path segment matches our regex
  for (const config of configs) {
    if (!config.regex) {
      continue;
    }

    const match = remainingPath.match(config.regex);

    // If our regex matches, we need to extract params from the path
    if (match) {
      const matchResult = config.pattern?.split('/').reduce<{
        pos: number; // Position of the current path param segment in the path (e.g in pattern `a/:b/:c`, `:a` is 0 and `:b` is 1)
        matchedParams: Record<string, Record<string, string>>; // The extracted params
      }>(
        (acc, p, index) => {
          if (!expo.isDynamicPart(p)) {
            return acc;
          }

          acc.pos += 1;

          // START FORK
          const decodedParamSegment = expo.safelyDecodeURIComponent(
            // const decodedParamSegment = decodeURIComponent(
            // The param segments appear every second item starting from 2 in the regex match result
            match[(acc.pos + 1) * 2]! // Remove trailing slash
              .replace(/\/$/, '')
          );
          // END FORK

          Object.assign(acc.matchedParams, {
            [p]: Object.assign(acc.matchedParams[p] || {}, {
              [index]: decodedParamSegment,
            }),
          });

          return acc;
        },
        { pos: -1, matchedParams: {} }
      );

      const matchedParams = matchResult.matchedParams || {};

      routes = config.routeNames.map((name) => {
        const routeConfig = configs.find((c) => {
          // Check matching name AND pattern in case same screen is used at different levels in config
          return c.screen === name && config.pattern.startsWith(c.pattern);
        });

        // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
        const normalizedPath = routeConfig?.path.split('/').filter(Boolean).join('/');

        // Get the number of segments in the initial pattern
        const numInitialSegments = routeConfig?.pattern
          // Extract the prefix from the pattern by removing the ending path pattern (e.g pattern=`a/b/c/d` and normalizedPath=`c/d` becomes `a/b`)
          .replace(new RegExp(`${escape(normalizedPath!)}$`), '')
          ?.split('/').length;

        const params = normalizedPath
          ?.split('/')
          .reduce<Record<string, unknown>>((acc, p, index) => {
            if (!expo.isDynamicPart(p)) {
              return acc;
            }

            // Get the real index of the path parameter in the matched path
            // by offsetting by the number of segments in the initial pattern
            const offset = numInitialSegments ? numInitialSegments - 1 : 0;
            // START FORK
            // const value = matchedParams[p]?.[index + offset];
            // TODO(@kitten): Assess which is intended, non-optional or getParamValue accepting undefined
            const value = expo.getParamValue(p, matchedParams[p]?.[index + offset]!);
            // END FORK

            if (value) {
              // START FORK
              // const key = p.replace(/^:/, '').replace(/\?$/, '');
              const key = expo.replacePart(p);
              // END FORK
              acc[key] = routeConfig?.parse?.[key] ? routeConfig.parse[key](value as any) : value;
            }

            return acc;
          }, {});

        if (params && Object.keys(params).length) {
          Object.assign(allParams, params);
          return { name, params };
        }

        return { name };
      });

      remainingPath = remainingPath.replace(match[1]!, '');

      break;
    }
  }

  // START FORK
  expo.populateParams(routes, allParams);
  // END FORK

  return { routes, remainingPath };
};

const createNormalizedConfigs = (
  screen: string,
  routeConfig: PathConfigMap<object>,
  routeNames: string[] = [],
  initials: InitialRouteConfig[],
  parentScreens: string[],
  parentPattern?: string
): RouteConfig[] => {
  const configs: RouteConfig[] = [];

  routeNames.push(screen);

  parentScreens.push(screen);

  // @ts-expect-error: TODO(@kitten): This is entirely untyped. The index access just flags this, but we're not typing the config properly here
  const config = routeConfig[screen];

  if (typeof config === 'string') {
    // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
    const pattern = parentPattern ? joinPaths(parentPattern, config) : config;

    configs.push(createConfigItem(screen, routeNames, pattern, config));
  } else if (typeof config === 'object') {
    let pattern: string | undefined;

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

      if (screen !== INTERNAL_SLOT_NAME) {
        configs.push(
          createConfigItem(screen, routeNames, pattern!, config.path, config.parse, config)
        );
      }
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

const createConfigItem = (
  screen: string,
  routeNames: string[],
  pattern: string,
  path: string,
  parse: ParseConfig | undefined = undefined,
  config: Record<string, any> = {}
): RouteConfig => {
  // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
  pattern = pattern.split('/').filter(Boolean).join('/');

  // START FORK
  const regex = pattern ? expo.routePatternToRegex(pattern) : undefined;
  // const regex = pattern
  //   ? new RegExp(
  //       `^(${pattern
  //         .split('/')
  //         .map((it) => {
  //           if (it.startsWith(':')) {
  //             return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
  //           }

  //           return `${it === '*' ? '.*' : escape(it)}\\/`;
  //         })
  //         .join('')})`
  //     )
  //   : undefined;
  // END FORK

  return {
    screen,
    regex,
    pattern,
    path,
    // The routeNames array is mutated, so copy it to keep the current state
    routeNames: [...routeNames],
    parse,
    // START FORK
    ...expo.createConfig(screen, pattern, routeNames, config),
    // END FORK
  };
};

const findParseConfigForRoute = (
  routeName: string,
  flatConfig: RouteConfig[]
): ParseConfig | undefined => {
  for (const config of flatConfig) {
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
    if (parentScreens.length === config.parentScreens.length) {
      let sameParents = true;
      for (let i = 0; i < parentScreens.length; i++) {
        if (parentScreens[i]!.localeCompare(config.parentScreens[i]!) !== 0) {
          sameParents = false;
          break;
        }
      }
      if (sameParents) {
        return routeName !== config.initialRouteName ? config.initialRouteName : undefined;
      }
    }
  }
  return undefined;
};

// Nested screens config for a level (values are string patterns or objects with their own
// `screens`/`initialRouteName`). Typed loosely because the linking config is untyped internally.
type ScreenConfigMap = Record<string, any>;

function getChildScreens(
  screens: ScreenConfigMap | undefined,
  name: string
): ScreenConfigMap | undefined {
  const entry = screens?.[name];
  if (entry && typeof entry === 'object' && entry.screens && Object.keys(entry.screens).length) {
    return entry.screens;
  }
  return undefined;
}

// Sibling route names for a level, in the config's declared order (which equals the rendered
// navigator's `routeNames` order). `present` covers routes actually placed here (focused + any
// inserted anchor); for real app configs the anchor is always a declared sibling, so this only adds
// names for synthetic configs whose `initialRouteName` has no screen entry.
function levelRouteNames(screens: ScreenConfigMap | undefined, present: string[]): string[] {
  const names = screens ? Object.keys(screens) : [];
  for (const name of present) {
    if (!names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

// Pick the focused child of a navigator when materializing a declared anchor's own subtree:
// its declared `initialRouteName`, else its index / empty-path route, else the first child.
function pickDefaultChild(screens: ScreenConfigMap, ownInitialRouteName?: string): string {
  if (ownInitialRouteName && screens[ownInitialRouteName]) {
    return ownInitialRouteName;
  }
  for (const name of Object.keys(screens)) {
    const cfg = screens[name];
    const cfgPath = typeof cfg === 'string' ? cfg : cfg?.path;
    if (cfgPath === '' || name === 'index' || name.endsWith('/index')) {
      return name;
    }
  }
  return Object.keys(screens)[0]!;
}

function shouldInheritDefaultSubtreeParams(
  name: string,
  screens: ScreenConfigMap | undefined
): boolean {
  const childScreens = getChildScreens(screens, name);
  return (
    !name.includes('/') &&
    !Object.keys(childScreens ?? {}).some((childName) => childName.includes('/'))
  );
}

// Build a route entry, and — when it is a navigator — its complete default subtree down to a leaf.
// Used for declared anchors: back (index--) must never land on a hollow route. `stateKey` is the
// key of the navigator this route lives in; the route's own key is minted from it, and its child
// navigator's state key is derived from that route key (see `getStateKey`).
function buildRouteWithDefaultSubtree(
  name: string,
  screens: ScreenConfigMap | undefined,
  stateKey: string,
  params: Record<string, any> | undefined
): CompleteRoute {
  const route: CompleteRoute = { key: getRouteKey({ stateKey, name }), name };
  if (params) {
    route.params = params;
  }

  const childScreens = getChildScreens(screens, name);
  if (childScreens) {
    const ownInitial = screens?.[name]?.initialRouteName as string | undefined;
    const childName = pickDefaultChild(childScreens, ownInitial);
    const childStateKey = getStateKey(route.key);
    route.state = {
      stale: false,
      key: childStateKey,
      index: 0,
      routeNames: levelRouteNames(childScreens, [childName]),
      routes: [buildRouteWithDefaultSubtree(childName, childScreens, childStateKey, params)],
    };
  }

  return route;
}

// Build the complete state for the matched route chain, threading the nested screens config and the
// parent route key down each level. Every level derives its state key from the parent route key
// (see `getStateKey`) — matching what the live reducers mint — then gets `stale: false`, explicit
// `index`, full sibling `routeNames`, and declared anchors materialized as complete branches.
const buildStateForChain = (
  chain: ParsedRoute[],
  screens: ScreenConfigMap | undefined,
  parentRouteKey: string | undefined,
  parentScreens: string[],
  initialRoutes: InitialRouteConfig[]
): CompleteResultState => {
  const focused = chain[0]!;
  const stateKey = getStateKey(parentRouteKey);

  const focusedRoute: CompleteRoute = {
    key: getRouteKey({ stateKey, name: focused.name }),
    name: focused.name,
  };
  if (focused.params) {
    focusedRoute.params = focused.params;
  }

  if (chain.length > 1) {
    focusedRoute.state = buildStateForChain(
      chain.slice(1),
      getChildScreens(screens, focused.name),
      focusedRoute.key,
      [...parentScreens, focused.name],
      initialRoutes
    );
  }

  const initialRouteName = findInitialRoute(focused.name, parentScreens, initialRoutes);

  let routes: CompleteRoute[];
  let index: number;
  if (initialRouteName) {
    routes = [
      buildRouteWithDefaultSubtree(
        initialRouteName,
        screens,
        stateKey,
        shouldInheritDefaultSubtreeParams(initialRouteName, screens) ? focused.params : undefined
      ),
      focusedRoute,
    ];
    index = 1;
  } else {
    routes = [focusedRoute];
    index = 0;
  }

  return {
    stale: false,
    key: stateKey,
    index,
    routeNames: levelRouteNames(
      screens,
      routes.map((r) => r.name)
    ),
    routes,
  };
};

const createNestedStateObject = (
  { path }: ReturnType<typeof expo.getUrlWithReactNavigationConcessions>,
  routes: ParsedRoute[],
  initialRoutes: InitialRouteConfig[],
  rootScreens: ScreenConfigMap | undefined,
  flatConfig?: RouteConfig[],
  hash?: string
): CompleteResultState => {
  const state = buildStateForChain(routes, rootScreens, undefined, [], initialRoutes);

  const route = findFocusedRoute(state as unknown as InitialState) as ParsedRoute;

  // START FORK
  // const params = parseQueryParams(
  const params = expo.parseQueryParams(
    path,
    route,
    flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined,
    hash
  );
  // END FORK

  // START FORK
  // expo.handleUrlParams(route, params, hash);
  if (params) {
    route.params = { ...route.params, ...params };
  }
  // END FORK

  return state;
};

// START FORK
// const parseQueryParams = (path: string, parseConfig?: Record<string, (value: string) => any>) => {
//   const query = path.split('?')[1];
//   const params = queryString.parse(query);

//   if (parseConfig) {
//     Object.keys(params).forEach((name) => {
//       if (Object.hasOwnProperty.call(parseConfig, name) && typeof params[name] === 'string') {
//         params[name] = parseConfig[name](params[name] as string);
//       }
//     });
//   }

//   return Object.keys(params).length ? params : undefined;
// };
// END FORK
