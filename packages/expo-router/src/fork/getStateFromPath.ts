import { INTERNAL_SLOT_NAME } from '../constants';
import type { PathConfigMap } from '../react-navigation/native';
import type { InitialState, NavigationState, PartialState } from '../react-navigation/routers';
import { escapeStringRegexp as escape } from '../utils/escapeStringRegexp';
import { findFocusedRoute } from './findFocusedRoute';
import type { ExpoOptions, ExpoRouteConfig } from './getStateFromPath-forks';
import * as expo from './getStateFromPath-forks';
import { validatePathConfig } from './validatePathConfig';

export type Options<ParamList extends object> = ExpoOptions & {
  path?: string;
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

export type ResultState = PartialState<NavigationState> & {
  state?: ResultState;
};

export type ParsedRoute = {
  name: string;
  path?: string;
  params?: Record<string, any> | undefined;
};

type ConfigResources = {
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
  segments: string[] = []
): ResultState | undefined {
  const { configs, configWithRegexes } = getConfigResources(options, segments);

  const screens = options?.screens;

  const expoPath = expo.getUrlWithReactNavigationConcessions(path);

  let remaining = expo.cleanPath(expoPath.nonstandardPathname);

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
      return createNestedStateObject(expoPath, routes, [], expoPath.hash);
    }

    return undefined;
  }

  if (remaining === '/') {
    // We need to add special handling of empty path so navigation to empty path also works
    // When handling empty path, we should only look at the root level config
    const match = expo.matchForEmptyPath(configWithRegexes);

    if (match) {
      return createNestedStateObject(
        expoPath,
        match.routeNames.map((name) => ({ name })),
        configs,
        expoPath.hash
      );
    }

    return undefined;
  }

  let result: PartialState<NavigationState> | undefined;
  let current: PartialState<NavigationState> | undefined;

  // We match the whole path against the regex instead of segments
  // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
  const { routes, remainingPath } = matchAgainstConfigs(remaining, configWithRegexes);

  if (routes !== undefined) {
    // This will always be empty if full path matched
    current = createNestedStateObject(expoPath, routes, configs, expoPath.hash);
    remaining = remainingPath;
    result = current;
  }

  if (current == null || result == null) {
    return undefined;
  }

  return result;
}

/**
 * Reference to the most recently computed config resources.
 */
let cachedConfigResources: [Options<object> | undefined, ConfigResources] = [
  undefined,
  prepareConfigResources(),
];

function getConfigResources<ParamList extends object>(
  options: Options<ParamList> | undefined,
  previousSegments?: string[]
) {
  // Recompute every time because config resources depend on the current state.
  cachedConfigResources = [options, prepareConfigResources(options, previousSegments)];

  return cachedConfigResources[1];
}

function prepareConfigResources(options?: Options<object>, previousSegments?: string[]) {
  if (options) {
    validatePathConfig(options);
  }

  const configs = getNormalizedConfigs(options?.screens, previousSegments);

  checkForDuplicatedConfigs(configs);

  const configWithRegexes = getConfigsWithRegexes(configs);

  return {
    configs,
    configWithRegexes,
  };
}

function getNormalizedConfigs(screens: PathConfigMap<object> = {}, previousSegments?: string[]) {
  // Create a normalized configs array which will be easier to use
  return ([] as RouteConfig[])
    .concat(
      ...Object.keys(screens).map((key) =>
        createNormalizedConfigs(key, screens as PathConfigMap<object>, [])
      )
    )
    .sort(expo.getRouteConfigSorter(previousSegments));
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
    regex: expo.configRegExp(c),
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
  const allParams = Object.create(null);

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
          const decodedParamSegment = expo.safelyDecodeURIComponent(
            // The param segments appear every second item starting from 2 in the regex match result
            match[(acc.pos + 1) * 2]! // Remove trailing slash
              .replace(/\/$/, '')
          );

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
            // TODO(@kitten): Assess which is intended, non-optional or getParamValue accepting undefined
            const value = expo.getParamValue(p, matchedParams[p]?.[index + offset]!);

            if (value) {
              const key = expo.replacePart(p);
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
  expo.populateParams(routes, allParams);

  return { routes, remainingPath };
};

const createNormalizedConfigs = (
  screen: string,
  routeConfig: PathConfigMap<object>,
  routeNames: string[] = [],
  parentPattern?: string
): RouteConfig[] => {
  const configs: RouteConfig[] = [];

  routeNames.push(screen);

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
      Object.keys(config.screens).forEach((nestedConfig) => {
        const result = createNormalizedConfigs(
          nestedConfig,
          config.screens as PathConfigMap<object>,
          routeNames,
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
  const regex = pattern ? expo.routePatternToRegex(pattern) : undefined;

  return {
    screen,
    regex,
    pattern,
    path,
    // The routeNames array is mutated, so copy it to keep the current state
    routeNames: [...routeNames],
    parse,
    ...expo.createConfig(screen, pattern, routeNames, config),
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

// returns state object with values depending on whether it is the end of state
const createStateObject = (route: ParsedRoute, isEmpty: boolean): InitialState =>
  isEmpty ? { routes: [route] } : { routes: [{ ...route, state: { routes: [] } }] };

const createNestedStateObject = (
  { path, ...expoURL }: ReturnType<typeof expo.getUrlWithReactNavigationConcessions>,
  routes: ParsedRoute[],
  flatConfig?: RouteConfig[],
  hash?: string
) => {
  let route = routes.shift() as ParsedRoute;

  const state: InitialState = createStateObject(route, routes.length === 0);

  if (routes.length > 0) {
    let nestedState = state;

    while ((route = routes.shift() as ParsedRoute)) {
      const nestedStateIndex = nestedState.index ?? nestedState.routes.length - 1;

      nestedState.routes[nestedStateIndex]!.state = createStateObject(route, routes.length === 0);

      if (routes.length > 0) {
        nestedState = nestedState.routes[nestedStateIndex]!.state as InitialState;
      }
    }
  }

  route = findFocusedRoute(state) as ParsedRoute;

  route.path = expoURL.pathWithoutGroups;

  const params = expo.parseQueryParams(
    path,
    route,
    flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined,
    hash
  );

  if (params) {
    route.params = { ...route.params, ...params };
  }

  return state;
};
