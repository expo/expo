import type {
  InitialState,
  NavigationState,
  ParamListBase,
  PartialState,
} from '@react-navigation/routers';
import escape from 'escape-string-regexp';
import * as queryString from 'query-string';

import { arrayStartsWith } from './arrayStartsWith';
import { findFocusedRoute } from './findFocusedRoute';
import { getPatternParts, type PatternPart } from './getPatternParts';
import { isArrayEqual } from './isArrayEqual';
import type { PathConfig, PathConfigMap } from './types';
import { validatePathConfig } from './validatePathConfig';

type Options<ParamList extends {}> = {
  path?: string;
  initialRouteName?: string;
  screens: PathConfigMap<ParamList>;
};

type ParseConfig = Record<string, (value: string) => unknown>;

type RouteConfig = {
  screen: string;
  regex?: RegExp;
  segments: string[];
  params: { screen: string; name?: string; index: number }[];
  routeNames: string[];
  parse?: ParseConfig;
};

type InitialRouteConfig = {
  initialRouteName: string;
  parentScreens: string[];
};

type ResultState = PartialState<NavigationState> & {
  state?: ResultState;
};

type ParsedRoute = {
  name: string;
  path?: string;
  params?: Record<string, unknown> | undefined;
};

type ConfigResources = {
  initialRoutes: InitialRouteConfig[];
  configs: RouteConfig[];
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
export function getStateFromPath<ParamList extends {}>(
  path: string,
  options?: Options<ParamList>
): ResultState | undefined {
  const { initialRoutes, configs } = getConfigResources(options);

  const screens = options?.screens;

  let remaining = path
    .replace(/\/+/g, '/') // Replace multiple slash (//) with single ones
    .replace(/^\//, '') // Remove extra leading slash
    .replace(/\?.*$/, ''); // Remove query params which we will handle later

  // Make sure there is a trailing slash
  remaining = remaining.endsWith('/') ? remaining : `${remaining}/`;

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
      return createNestedStateObject(path, routes, initialRoutes);
    }

    return undefined;
  }

  if (remaining === '/') {
    // We need to add special handling of empty path so navigation to empty path also works
    // When handling empty path, we should only look at the root level config
    const match = configs.find((config) => config.segments.join('/') === '');

    if (match) {
      return createNestedStateObject(
        path,
        match.routeNames.map((name) => ({ name })),
        initialRoutes,
        configs
      );
    }

    return undefined;
  }

  let result: PartialState<NavigationState> | undefined;
  let current: PartialState<NavigationState> | undefined;

  // We match the whole path against the regex instead of segments
  // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
  const { routes, remainingPath } = matchAgainstConfigs(remaining, configs);

  if (routes !== undefined) {
    // This will always be empty if full path matched
    current = createNestedStateObject(path, routes, initialRoutes, configs);
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
const cachedConfigResources = new WeakMap<Options<{}>, ConfigResources>();

function getConfigResources<ParamList extends {}>(
  options: Options<ParamList> | undefined
) {
  if (!options) return prepareConfigResources();

  const cached = cachedConfigResources.get(options);

  if (cached) return cached;

  const resources = prepareConfigResources(options);

  cachedConfigResources.set(options, resources);

  return resources;
}

function prepareConfigResources(options?: Options<{}>) {
  if (options) {
    validatePathConfig(options);
  }

  const initialRoutes = getInitialRoutes(options);
  const configs = getSortedNormalizedConfigs(initialRoutes, options?.screens);

  checkForDuplicatedConfigs(configs);

  const configWithRegexes = getConfigsWithRegexes(configs);

  return {
    initialRoutes,
    configs,
    configWithRegexes,
  };
}

function getInitialRoutes(options?: Options<{}>) {
  const initialRoutes: InitialRouteConfig[] = [];

  if (options?.initialRouteName) {
    initialRoutes.push({
      initialRouteName: options.initialRouteName,
      parentScreens: [],
    });
  }

  return initialRoutes;
}

function getSortedNormalizedConfigs(
  initialRoutes: InitialRouteConfig[],
  screens: Record<string, string | PathConfig<ParamListBase>> = {}
) {
  // Create a normalized configs array which will be easier to use
  return ([] as RouteConfig[])
    .concat(
      ...Object.keys(screens).map((key) =>
        createNormalizedConfigs(key, screens, initialRoutes, [], [], [])
      )
    )
    .sort((a, b) => {
      // Sort config from most specific to least specific:
      // - more segments
      // - static segments
      // - params with regex
      // - regular params
      // - wildcard

      // If 2 patterns are same, move the one with less route names up
      // This is an error state, so it's only useful for consistent error messages
      if (isArrayEqual(a.segments, b.segments)) {
        return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
      }

      // If one of the patterns starts with the other, it's more exhaustive
      // So move it up
      if (arrayStartsWith(a.segments, b.segments)) {
        return -1;
      }

      if (arrayStartsWith(b.segments, a.segments)) {
        return 1;
      }

      for (let i = 0; i < Math.max(a.segments.length, b.segments.length); i++) {
        // if b is longer, b gets higher priority
        if (a.segments[i] == null) {
          return 1;
        }

        // if a is longer, a gets higher priority
        if (b.segments[i] == null) {
          return -1;
        }

        const aWildCard = a.segments[i] === '*';
        const bWildCard = b.segments[i] === '*';
        const aParam = a.segments[i].startsWith(':');
        const bParam = b.segments[i].startsWith(':');
        const aRegex = aParam && a.segments[i].includes('(');
        const bRegex = bParam && b.segments[i].includes('(');

        // if both are wildcard or regex, we compare next component
        if ((aWildCard && bWildCard) || (aRegex && bRegex)) {
          continue;
        }

        // if only a is wildcard, b gets higher priority
        if (aWildCard && !bWildCard) {
          return 1;
        }

        // if only b is wildcard, a gets higher priority
        if (bWildCard && !aWildCard) {
          return -1;
        }

        // If only a has a param, b gets higher priority
        if (aParam && !bParam) {
          return 1;
        }

        // If only b has a param, a gets higher priority
        if (bParam && !aParam) {
          return -1;
        }

        // if only a has regex, a gets higher priority
        if (aRegex && !bRegex) {
          return -1;
        }

        // if only b has regex, b gets higher priority
        if (bRegex && !aRegex) {
          return 1;
        }
      }

      return a.segments.length - b.segments.length;
    });
}

function checkForDuplicatedConfigs(configs: RouteConfig[]) {
  // Check for duplicate patterns in the config
  configs.reduce<Record<string, RouteConfig>>((acc, config) => {
    const pattern = config.segments.join('/');

    if (acc[pattern]) {
      const a = acc[pattern].routeNames;
      const b = config.routeNames;

      // It's not a problem if the path string omitted from a inner most screen
      // For example, it's ok if a path resolves to `A > B > C` or `A > B`
      const intersects =
        a.length > b.length
          ? b.every((it, i) => a[i] === it)
          : a.every((it, i) => b[i] === it);

      if (!intersects) {
        throw new Error(
          `Found conflicting screens with the same pattern. The pattern '${
            pattern
          }' resolves to both '${a.join(' > ')}' and '${b.join(
            ' > '
          )}'. Patterns must be unique and cannot resolve to more than one screen.`
        );
      }
    }

    return Object.assign(acc, {
      [pattern]: config,
    });
  }, {});
}

function getConfigsWithRegexes(configs: RouteConfig[]) {
  return configs.map((c) => ({
    ...c,
    // Add `$` to the regex to make sure it matches till end of the path and not just beginning
    regex: c.regex ? new RegExp(c.regex.source + '$') : undefined,
  }));
}

const matchAgainstConfigs = (remaining: string, configs: RouteConfig[]) => {
  let routes: ParsedRoute[] | undefined;
  let remainingPath = remaining;

  // Go through all configs, and see if the next path segment matches our regex
  for (const config of configs) {
    if (!config.regex) {
      continue;
    }

    const match = remainingPath.match(config.regex);

    // If our regex matches, we need to extract params from the path
    if (match) {
      routes = config.routeNames.map((routeName) => {
        const routeConfig = configs.find((c) => {
          // Check matching name AND pattern in case same screen is used at different levels in config
          return (
            c.screen === routeName &&
            arrayStartsWith(config.segments, c.segments)
          );
        });

        const params =
          routeConfig && match.groups
            ? Object.fromEntries(
                Object.entries(match.groups)
                  .map(([key, value]) => {
                    const index = Number(key.replace('param_', ''));
                    const param = routeConfig.params.find(
                      (it) => it.index === index
                    );

                    if (param?.screen === routeName && param?.name) {
                      return [param.name, value];
                    }

                    return null;
                  })
                  .filter((it) => it != null)
                  .map(([key, value]) => {
                    if (value == null) {
                      return [key, undefined];
                    }

                    const decoded = decodeURIComponent(value);
                    const parsed = routeConfig.parse?.[key]
                      ? routeConfig.parse[key](decoded)
                      : decoded;

                    return [key, parsed];
                  })
              )
            : undefined;

        if (params && Object.keys(params).length) {
          return { name: routeName, params };
        }

        return { name: routeName };
      });

      remainingPath = remainingPath.replace(match[0], '');

      break;
    }
  }

  return { routes, remainingPath };
};

const createNormalizedConfigs = (
  screen: string,
  routeConfig: Record<string, string | PathConfig<ParamListBase>>,
  initials: InitialRouteConfig[],
  paths: { screen: string; path: string }[],
  parentScreens: string[],
  routeNames: string[]
): RouteConfig[] => {
  const configs: RouteConfig[] = [];

  routeNames.push(screen);

  parentScreens.push(screen);

  const config = routeConfig[screen];

  if (typeof config === 'string') {
    paths.push({ screen, path: config });
    configs.push(createConfigItem(screen, [...routeNames], [...paths]));
  } else if (typeof config === 'object') {
    // if an object is specified as the value (e.g. Foo: { ... }),
    // it can have `path` property and
    // it could have `screens` prop which has nested configs
    if (typeof config.path === 'string') {
      if (config.exact && config.path == null) {
        throw new Error(
          `Screen '${screen}' doesn't specify a 'path'. A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. \`path: ''\`.`
        );
      }

      // We should add alias configs after the main config
      // So unless they are more specific, main config will be matched first
      const aliasConfigs = [];

      if (config.alias) {
        for (const alias of config.alias) {
          if (typeof alias === 'string') {
            aliasConfigs.push(
              createConfigItem(
                screen,
                [...routeNames],
                [...paths, { screen, path: alias }],
                config.parse
              )
            );
          } else if (typeof alias === 'object') {
            aliasConfigs.push(
              createConfigItem(
                screen,
                [...routeNames],
                alias.exact
                  ? [{ screen, path: alias.path }]
                  : [...paths, { screen, path: alias.path }],
                alias.parse
              )
            );
          }
        }
      }

      if (config.exact) {
        // If it's an exact path, we don't need to keep track of the parent screens
        // So we can clear it
        paths.length = 0;
      }

      paths.push({ screen, path: config.path });
      configs.push(
        createConfigItem(screen, [...routeNames], [...paths], config.parse)
      );

      configs.push(...aliasConfigs);
    }

    if (
      typeof config !== 'string' &&
      typeof config.path !== 'string' &&
      config.alias?.length
    ) {
      throw new Error(
        `Screen '${screen}' doesn't specify a 'path'. A 'path' needs to be specified in order to use 'alias'.`
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
          config.screens as Record<string, string | PathConfig<ParamListBase>>,
          initials,
          [...paths],
          [...parentScreens],
          routeNames
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
  paths: { screen: string; path: string }[],
  parse?: ParseConfig
): RouteConfig => {
  const parts: (PatternPart & { screen: string })[] = [];

  // Parse the path string into parts for easier matching
  for (const { screen, path } of paths) {
    parts.push(...getPatternParts(path).map((part) => ({ ...part, screen })));
  }

  const regex = parts.length
    ? new RegExp(
        `^(${parts
          .map((it, i) => {
            if (it.param) {
              const reg = it.regex || '[^/]+';

              return `(((?<param_${i}>${reg})\\/)${it.optional ? '?' : ''})`;
            }

            return `${it.segment === '*' ? '.*' : escape(it.segment)}\\/`;
          })
          .join('')})$`
      )
    : undefined;

  const segments = parts.map((it) => it.segment);
  const params = parts
    .map((it, i) =>
      it.param
        ? {
            index: i,
            screen: it.screen,
            name: it.param,
          }
        : null
    )
    .filter((it) => it != null);

  return {
    screen,
    regex,
    segments,
    params,
    routeNames,
    parse,
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
        if (parentScreens[i].localeCompare(config.parentScreens[i]) !== 0) {
          sameParents = false;
          break;
        }
      }
      if (sameParents) {
        return routeName !== config.initialRouteName
          ? config.initialRouteName
          : undefined;
      }
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
    } else {
      return {
        routes: [route],
      };
    }
  } else {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{ name: initialRoute }, { ...route, state: { routes: [] } }],
      };
    } else {
      return {
        routes: [{ ...route, state: { routes: [] } }],
      };
    }
  }
};

const createNestedStateObject = (
  path: string,
  routes: ParsedRoute[],
  initialRoutes: InitialRouteConfig[],
  flatConfig?: RouteConfig[]
) => {
  let route = routes.shift() as ParsedRoute;
  const parentScreens: string[] = [];

  let initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);

  parentScreens.push(route.name);

  const state: InitialState = createStateObject(
    initialRoute,
    route,
    routes.length === 0
  );

  if (routes.length > 0) {
    let nestedState = state;

    while ((route = routes.shift() as ParsedRoute)) {
      initialRoute = findInitialRoute(route.name, parentScreens, initialRoutes);

      const nestedStateIndex =
        nestedState.index || nestedState.routes.length - 1;

      nestedState.routes[nestedStateIndex].state = createStateObject(
        initialRoute,
        route,
        routes.length === 0
      );

      if (routes.length > 0) {
        nestedState = nestedState.routes[nestedStateIndex]
          .state as InitialState;
      }

      parentScreens.push(route.name);
    }
  }

  route = findFocusedRoute(state) as ParsedRoute;
  route.path = path.replace(/\/$/, '');

  const params = parseQueryParams(
    path,
    flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined
  );

  if (params) {
    route.params = { ...route.params, ...params };
  }

  return state;
};

const parseQueryParams = (
  path: string,
  parseConfig?: Record<string, (value: string) => unknown>
) => {
  const query = path.split('?')[1];
  const params: Record<string, unknown> = queryString.parse(query);

  if (parseConfig) {
    Object.keys(params).forEach((name) => {
      if (
        Object.hasOwnProperty.call(parseConfig, name) &&
        typeof params[name] === 'string'
      ) {
        params[name] = parseConfig[name](params[name]);
      }
    });
  }

  return Object.keys(params).length ? params : undefined;
};
