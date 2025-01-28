import { PathConfig, PathConfigMap } from '@react-navigation/native';
import type { NavigationState, PartialState, Route } from '@react-navigation/routers';
import * as queryString from 'query-string';

import * as expo from './getPathFromState-forks';
import type { ExpoConfigItem, ExpoOptions } from './getPathFromState-forks';

// START FORK
export type Options<ParamList extends object> = ExpoOptions & {
  path?: string;
  initialRouteName?: string;
  screens: PathConfigMap<ParamList>;
};
// END FORK

export type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;

export type StringifyConfig = Record<string, (value: any) => string>;

// START FORK
type ConfigItem = ExpoConfigItem & {
  pattern?: string;
  stringify?: StringifyConfig;
  screens?: Record<string, ConfigItem>;
};
// END FORK

const getActiveRoute = (state: State): { name: string; params?: object } => {
  const route =
    typeof state.index === 'number'
      ? state.routes[state.index]
      : state.routes[state.routes.length - 1];

  if (route.state) {
    return getActiveRoute(route.state);
  }

  return route;
};

let cachedNormalizedConfigs: [PathConfigMap<object> | undefined, Record<string, ConfigItem>] = [
  undefined,
  {},
];

/**
 * Utility to serialize a navigation state object to a path string.
 *
 * @example
 * ```js
 * getPathFromState(
 *   {
 *     routes: [
 *       {
 *         name: 'Chat',
 *         params: { author: 'Jane', id: 42 },
 *       },
 *     ],
 *   },
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         stringify: { author: author => author.toLowerCase() }
 *       }
 *     }
 *   }
 * )
 * ```
 *
 * @param state Navigation state to serialize.
 * @param options Extra options to fine-tune how to serialize the path.
 * @returns Path representing the state, e.g. /foo/bar?count=42.
 */
export function getPathFromState<ParamList extends object>(
  state: State,
  options?: Options<ParamList>
): string {
  return getPathDataFromState(state, options).path;
}

export function getPathDataFromState<ParamList extends object>(
  state: State,
  options?: Options<ParamList>
) {
  if (state == null) {
    throw Error("Got 'undefined' for the navigation state. You must pass a valid state object.");
  }

  if (options) {
    // START FORK
    expo.validatePathConfig(options);
    // validatePathConfig(options);
    // END FORK
  }

  // Create a normalized configs object which will be easier to use
  if (cachedNormalizedConfigs[0] !== options?.screens) {
    cachedNormalizedConfigs = [
      options?.screens,
      options?.screens ? createNormalizedConfigs(options.screens) : {},
    ];
  }
  const configs: Record<string, ConfigItem> = cachedNormalizedConfigs[1];

  let path = '/';
  let current: State | undefined = state;

  const allParams: Record<string, any> = {};

  while (current) {
    let index = typeof current.index === 'number' ? current.index : 0;
    let route = current.routes[index] as Route<string> & {
      state?: State;
    };

    let pattern: string | undefined;

    let focusedParams: Record<string, any> | undefined;
    const focusedRoute = getActiveRoute(state);
    let currentOptions = configs;

    // Keep all the route names that appeared during going deeper in config in case the pattern is resolved to undefined
    const nestedRouteNames: string[] = [];

    let hasNext = true;

    while (route.name in currentOptions && hasNext) {
      pattern = currentOptions[route.name].pattern;

      nestedRouteNames.push(route.name);

      if (route.params) {
        const stringify = currentOptions[route.name]?.stringify;

        // START FORK
        // This mutates allParams
        const currentParams = expo.fixCurrentParams(allParams, route, stringify);

        // const currentParams = Object.fromEntries(
        //   Object.entries(route.params).map(([key, value]) => [
        //     key,
        //     stringify?.[key] ? stringify[key](value) : String(value),
        //   ])
        // );

        // if (pattern) {
        //   Object.assign(allParams, currentParams);
        // }
        // END FORK

        if (focusedRoute === route) {
          // If this is the focused route, keep the params for later use
          // We save it here since it's been stringified already
          focusedParams = { ...currentParams };

          pattern
            ?.split('/')
            .filter((p) => expo.isDynamicPart(p))
            // eslint-disable-next-line no-loop-func
            .forEach((p) => {
              const name = expo.getParamName(p);

              // Remove the params present in the pattern since we'll only use the rest for query string
              if (focusedParams) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete focusedParams[name];
              }
            });
        }
      }

      // If there is no `screens` property or no nested state, we return pattern
      if (!currentOptions[route.name].screens || route.state === undefined) {
        // START FORK
        // Expo Router can end up in some configs that React Navigation doesn't seem to support
        // We can get around this by providing a fake state
        const screens = currentOptions[route.name].screens;
        const screen =
          route.params && 'screen' in route.params
            ? route.params.screen?.toString()
            : screens
              ? Object.keys(screens)[0]
              : undefined;

        if (screen && screens && currentOptions[route.name].screens?.[screen]) {
          route = { ...screens[screen], name: screen, key: screen };
          currentOptions = screens;
        } else {
          hasNext = false;
        }
        // hasNext = false;
        // END FORK
      } else {
        index =
          typeof route.state.index === 'number' ? route.state.index : route.state.routes.length - 1;

        const nextRoute = route.state.routes[index];
        const nestedConfig = currentOptions[route.name].screens;

        // if there is config for next route name, we go deeper
        if (nestedConfig && nextRoute.name in nestedConfig) {
          route = nextRoute as Route<string> & { state?: State };
          currentOptions = nestedConfig;
        } else {
          // If not, there is no sense in going deeper in config
          hasNext = false;
        }
      }
    }

    if (pattern === undefined) {
      pattern = nestedRouteNames.join('/');
    }

    if (currentOptions[route.name] !== undefined) {
      // START FORK
      path += expo.getPathWithConventionsCollapsed({
        ...options,
        pattern,
        route,
        params: allParams,
        initialRouteName: configs[route.name]?.initialRouteName,
      });
      // path += pattern
      //   .split('/')
      //   .map((p) => {
      //     const name = getParamName(p);

      //     // We don't know what to show for wildcard patterns
      //     // Showing the route name seems ok, though whatever we show here will be incorrect
      //     // Since the page doesn't actually exist
      //     if (p === '*') {
      //       return route.name;
      //     }

      //     // If the path has a pattern for a param, put the param in the path
      //     if (p.startsWith(':')) {
      //       const value = allParams[name];

      //       if (value === undefined && p.endsWith('?')) {
      //         // Optional params without value assigned in route.params should be ignored
      //         return '';
      //       }

      //       // Valid characters according to
      //       // https://datatracker.ietf.org/doc/html/rfc3986#section-3.3 (see pchar definition)
      //       return String(value).replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]/g, (char) =>
      //         encodeURIComponent(char)
      //       );
      //     }

      //     return encodeURIComponent(p);
      //   })
      //   .join('/');
      // } else {
    } else if (!route.name.startsWith('+')) {
      path += encodeURIComponent(route.name);
    }
    // END FORK

    if (!focusedParams) {
      focusedParams = focusedRoute.params;
    }

    if (route.state) {
      path += '/';
    } else if (focusedParams) {
      for (const param in focusedParams) {
        if (focusedParams[param] === 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete focusedParams[param];
        }
      }

      // START FORK
      delete focusedParams['#'];
      // END FORK

      const query = queryString.stringify(focusedParams, { sort: false });
      if (query) {
        path += `?${query}`;
      }
    }

    current = route.state;
  }

  // Remove multiple as well as trailing slashes
  path = path.replace(/\/+/g, '/');
  path = path.length > 1 ? path.replace(/\/$/, '') : path;

  // Include the root path if specified
  if (options?.path) {
    path = joinPaths(options.path, path);
  }

  // START FORK
  path = expo.appendBaseUrl(path);
  if (allParams['#']) {
    path += `#${allParams['#']}`;
  }
  // END FORK

  // START FORK
  return { path, params: allParams };
  // END FORK
}

// const getParamName = (pattern: string) => pattern.replace(/^:/, '').replace(/\?$/, '');

const joinPaths = (...paths: string[]): string =>
  ([] as string[])
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');

const createConfigItem = (
  config: PathConfig<object> | string,
  parentPattern?: string
): ConfigItem => {
  if (typeof config === 'string') {
    // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
    const pattern = parentPattern ? joinPaths(parentPattern, config) : config;

    return { pattern };
  }

  if (config.exact && config.path === undefined) {
    throw new Error(
      "A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`."
    );
  }

  // If an object is specified as the value (e.g. Foo: { ... }),
  // It can have `path` property and `screens` prop which has nested configs
  const pattern =
    config.exact !== true ? joinPaths(parentPattern || '', config.path || '') : config.path || '';

  const screens = config.screens ? createNormalizedConfigs(config.screens, pattern) : undefined;

  return {
    // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
    pattern: pattern?.split('/').filter(Boolean).join('/'),
    stringify: config.stringify,
    screens,
  };
};

const createNormalizedConfigs = (
  options: PathConfigMap<object>,
  pattern?: string
): Record<string, ConfigItem> =>
  Object.fromEntries(
    Object.entries(options).map(([name, c]) => {
      const result = createConfigItem(c, pattern);

      return [name, result];
    })
  );

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
