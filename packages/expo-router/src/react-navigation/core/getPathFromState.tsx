import type {
  NavigationState,
  PartialState,
  Route,
} from '@react-navigation/routers';
import * as queryString from 'query-string';

import { getPatternParts, type PatternPart } from './getPatternParts';
import type { PathConfig, PathConfigMap } from './types';
import { validatePathConfig } from './validatePathConfig';

type Options<ParamList extends {}> = {
  path?: string;
  initialRouteName?: string;
  screens: PathConfigMap<ParamList>;
};

type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;

type StringifyConfig = Record<string, (value: unknown) => string>;

type ConfigItem = {
  parts?: PatternPart[];
  stringify?: StringifyConfig;
  screens?: Record<string, ConfigItem>;
};

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

const cachedNormalizedConfigs = new WeakMap<
  PathConfigMap<{}>,
  Record<string, ConfigItem>
>();

const getNormalizedConfigs = (options?: Options<{}>) => {
  if (!options?.screens) return {};

  const cached = cachedNormalizedConfigs.get(options?.screens);

  if (cached) return cached;

  const normalizedConfigs = createNormalizedConfigs(options.screens);

  cachedNormalizedConfigs.set(options.screens, normalizedConfigs);

  return normalizedConfigs;
};

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
export function getPathFromState<ParamList extends {}>(
  state: State,
  options?: Options<ParamList>
): string {
  if (state == null) {
    throw Error(
      `Got '${String(state)}' for the navigation state. You must pass a valid state object.`
    );
  }

  if (options) {
    validatePathConfig(options);
  }

  const configs = getNormalizedConfigs(options);

  let path = '/';
  let current: State | undefined = state;

  const allParams: Record<string, string> = {};

  while (current) {
    let index = typeof current.index === 'number' ? current.index : 0;
    let route = current.routes[index] as Route<string> & {
      state?: State;
    };

    let parts: PatternPart[] | undefined;

    let focusedParams: Record<string, string> | undefined;
    let currentOptions = configs;

    const focusedRoute = getActiveRoute(state);

    // Keep all the route names that appeared during going deeper in config in case the pattern is resolved to undefined
    const nestedRouteNames = [];

    let hasNext = true;

    while (route.name in currentOptions && hasNext) {
      parts = currentOptions[route.name].parts;

      nestedRouteNames.push(route.name);

      if (route.params) {
        const options = currentOptions[route.name];

        const currentParams = Object.fromEntries(
          Object.entries(route.params)
            .map(([key, value]): [string, string] | null => {
              if (value === undefined) {
                if (options) {
                  const optional = options.parts?.find(
                    (part) => part.param === key
                  )?.optional;

                  if (optional) {
                    return null;
                  }
                } else {
                  return null;
                }
              }

              const stringify = options?.stringify?.[key] ?? String;

              return [key, stringify(value)];
            })
            .filter((entry) => entry != null)
        );

        if (parts?.length) {
          Object.assign(allParams, currentParams);
        }

        if (focusedRoute === route) {
          // If this is the focused route, keep the params for later use
          // We save it here since it's been stringified already
          focusedParams = { ...currentParams };

          parts
            // eslint-disable-next-line no-loop-func
            ?.forEach(({ param }) => {
              if (param) {
                // Remove the params present in the pattern since we'll only use the rest for query string
                if (focusedParams) {
                  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                  delete focusedParams[param];
                }
              }
            });
        }
      }

      // If there is no `screens` property or no nested state, we return pattern
      if (!currentOptions[route.name].screens || route.state === undefined) {
        hasNext = false;
      } else {
        index =
          typeof route.state.index === 'number'
            ? route.state.index
            : route.state.routes.length - 1;

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

    if (currentOptions[route.name] !== undefined) {
      path += parts
        ?.map(({ segment, param, optional }) => {
          // We don't know what to show for wildcard patterns
          // Showing the route name seems ok, though whatever we show here will be incorrect
          // Since the page doesn't actually exist
          if (segment === '*') {
            return route.name;
          }

          // If the path has a pattern for a param, put the param in the path
          if (param) {
            const value = allParams[param];

            if (value === undefined && optional) {
              // Optional params without value assigned in route.params should be ignored
              return '';
            }

            // Valid characters according to
            // https://datatracker.ietf.org/doc/html/rfc3986#section-3.3 (see pchar definition)
            return Array.from(String(value))
              .map((char) =>
                /[^A-Za-z0-9\-._~!$&'()*+,;=:@]/g.test(char)
                  ? encodeURIComponent(char)
                  : char
              )
              .join('');
          }

          return encodeURIComponent(segment);
        })
        .join('/');
    } else {
      path += encodeURIComponent(route.name);
    }

    if (!focusedParams && focusedRoute.params) {
      focusedParams = Object.fromEntries(
        Object.entries(focusedRoute.params).map(([key, value]) => [
          key,
          String(value),
        ])
      );
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

      const query = queryString.stringify(focusedParams, { sort: false });

      if (query) {
        path += `?${query}`;
      }
    }

    current = route.state;
  }

  // Include the root path if specified
  if (options?.path) {
    path = `${options.path}/${path}`;
  }

  // Remove multiple as well as trailing slashes
  path = path.replace(/\/+/g, '/');
  path = path.length > 1 ? path.replace(/\/$/, '') : path;

  // If path doesn't start with a slash, add it
  // This makes sure that history.pushState will update the path correctly instead of appending
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return path;
}

const createConfigItem = (
  config: PathConfig<object> | string,
  parentParts?: PatternPart[]
): ConfigItem => {
  if (typeof config === 'string') {
    // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
    const parts = getPatternParts(config);

    if (parentParts) {
      return { parts: [...parentParts, ...parts] };
    }

    return { parts };
  }

  if (config.exact && config.path === undefined) {
    throw new Error(
      "A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`."
    );
  }

  // If an object is specified as the value (e.g. Foo: { ... }),
  // It can have `path` property and `screens` prop which has nested configs
  const parts =
    config.exact !== true
      ? [
          ...(parentParts || []),
          ...(config.path ? getPatternParts(config.path) : []),
        ]
      : config.path
        ? getPatternParts(config.path)
        : undefined;

  const screens = config.screens
    ? createNormalizedConfigs(config.screens, parts)
    : undefined;

  return {
    parts,
    stringify: config.stringify,
    screens,
  };
};

const createNormalizedConfigs = (
  options: PathConfigMap<object>,
  parts?: PatternPart[]
): Record<string, ConfigItem> =>
  Object.fromEntries(
    Object.entries(options).map(([name, c]) => {
      const result = createConfigItem(c, parts);

      return [name, result];
    })
  );
