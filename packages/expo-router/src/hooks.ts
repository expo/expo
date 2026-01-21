'use client';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { use } from 'react';

import { LocalRouteParamsContext, useRouteNode } from './Route';
import { INTERNAL_SLOT_NAME } from './constants';
import { store, useRouteInfo } from './global-state/router-store';
import { router, Router } from './imperative-api';
import { resolveHref } from './link/href';
import { usePreviewInfo } from './link/preview/PreviewRouteContext';
import { ServerDataLoaderContext } from './loaders/ServerDataLoaderContext';
import { fetchLoaderModule } from './loaders/utils';
import { RouteParams, RouteSegments, UnknownOutputParams, Route, LoaderFunction } from './types';

export { useRouteInfo };

/**
 * Returns the [navigation state](https://reactnavigation.org/docs/navigation-state/)
 * of the navigator which contains the current screen.
 *
 * @example
 * ```tsx
 * import { useRootNavigationState } from 'expo-router';
 *
 * export default function Route() {
 *  const { routes } = useRootNavigationState();
 *
 *  return <Text>{routes[0].name}</Text>;
 * }
 * ```
 */
export function useRootNavigationState() {
  const parent =
    // We assume that this is called from routes in __root
    // Users cannot customize the generated Sitemap or NotFound routes, so we should be safe
    useNavigation<NavigationProp<object, never, string>>().getParent(INTERNAL_SLOT_NAME);
  if (!parent) {
    throw new Error(
      'useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.'
    );
  }
  return parent.getState();
}

/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
export function useRootNavigation() {
  return store.navigationRef.current;
}

/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
export function useNavigationContainerRef() {
  return store.navigationRef;
}

const displayWarningForProp = (prop: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `router.${prop} should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'.`
    );
  }
};

const createNOOPWithWarning = (prop: string) => () => displayWarningForProp(prop);

const routerWithWarnings: Router = {
  back: createNOOPWithWarning('back'),
  canGoBack: () => {
    displayWarningForProp('canGoBack');
    return false;
  },
  push: createNOOPWithWarning('push'),
  navigate: createNOOPWithWarning('navigate'),
  replace: createNOOPWithWarning('replace'),
  dismiss: createNOOPWithWarning('dismiss'),
  dismissTo: createNOOPWithWarning('dismissTo'),
  dismissAll: createNOOPWithWarning('dismissAll'),
  canDismiss: () => {
    displayWarningForProp('canDismiss');
    return false;
  },
  setParams: createNOOPWithWarning('setParams'),
  reload: createNOOPWithWarning('reload'),
  prefetch: createNOOPWithWarning('prefetch'),
};

/**
 *
 * Returns the [Router](#router) object for imperative navigation.
 *
 * @example
 *```tsx
 * import { useRouter } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *  const router = useRouter();
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
export function useRouter(): Router {
  const { isPreview } = usePreviewInfo();
  if (isPreview) {
    return routerWithWarnings;
  }
  return router;
}

/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
export function useUnstableGlobalHref(): string {
  return useRouteInfo().unstable_globalHref;
}

/**
 * Returns a list of selected file segments for the currently selected route. Segments are not normalized,
 * so they will be the same as the file path. For example, `/[id]?id=normal` becomes `["[id]"]`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useSegments } from 'expo-router';
 *
 * export default function Route() {
 *   // segments = ["profile", "[user]"]
 *   const segments = useSegments();
 *
 *   return <Text>Hello</Text>;
 * }
 * ```
 *
 *
 * `useSegments` can be typed using an abstract. Consider the following file structure:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.tsx
 *     - followers.tsx
 *   - settings.tsx
 * ```
 *
 *
 * This can be strictly typed using the following abstract with `useSegments` hook:
 *
 * ```tsx
 * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
 * ```
 */
export function useSegments<TSegments extends Route = Route>(): RouteSegments<TSegments>;

/**
 *  @hidden
 */
export function useSegments<TSegments extends RouteSegments<Route>>(): TSegments;
export function useSegments() {
  return useRouteInfo().segments;
}

/**
 * Returns the currently selected route location without search parameters. For example, `/acme?foo=bar` returns `/acme`.
 * Segments will be normalized. For example, `/[id]?id=normal` becomes `/normal`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { usePathname } from 'expo-router';
 *
 * export default function Route() {
 *   // pathname = "/profile/baconbrix"
 *   const pathname = usePathname();
 *
 *   return <Text>Pathname: {pathname}</Text>;
 * }
 * ```
 */
export function usePathname(): string {
  return useRouteInfo().pathname;
}

/**
 * @hidden
 */
export function useGlobalSearchParams<
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): TParams;

/**
 * @hidden
 */
export function useGlobalSearchParams<TRoute extends Route>(): RouteParams<TRoute>;

/**
 * Returns URL parameters for globally selected route, including dynamic path segments.
 * This function updates even when the route is not focused. Useful for analytics or
 * other background operations that don't draw to the screen.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * When querying search params in a stack, opt-towards using
 * [`useLocalSearchParams`](#uselocalsearchparams) because it will only update when the route is focused.
 *
 * > **Note:** For usage information, see
 * [Local versus global search parameters](/router/reference/url-parameters/#local-versus-global-url-parameters).
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useGlobalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *   // user=baconbrix & extra=info
 *   const { user, extra } = useGlobalSearchParams();
 *
 *   return <Text>User: {user}</Text>;
 * }
 * ```
 */
export function useGlobalSearchParams<
  TRoute extends Route,
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): RouteParams<TRoute> & TParams;
export function useGlobalSearchParams() {
  return useRouteInfo().params;
}

/**
 * @hidden
 */
export function useLocalSearchParams<
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): TParams;

/**
 * @hidden
 */
export function useLocalSearchParams<TRoute extends Route>(): RouteParams<TRoute>;

/**
 * Returns the URL parameters for the contextually focused route. Useful for stacks where you may push a new screen
 * that changes the query parameters.  For dynamic routes, both the route parameters and the search parameters are returned.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * To observe updates even when the invoking route is not focused, use [`useGlobalSearchParams`](#useglobalsearchparams).
 *
 * > **Note:** For usage information, see
 * [Local versus global search parameters](/router/reference/url-parameters/#local-versus-global-url-parameters).
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLocalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *  // user=baconbrix & extra=info
 *  const { user, extra } = useLocalSearchParams();
 *
 *  return <Text>User: {user}</Text>;
 * }
 */
export function useLocalSearchParams<
  TRoute extends Route,
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): RouteParams<TRoute> & TParams;
export function useLocalSearchParams() {
  const params = React.use(LocalRouteParamsContext) ?? {};
  const { params: previewParams } = usePreviewInfo();
  return Object.fromEntries(
    Object.entries(previewParams ?? params).map(([key, value]) => {
      // React Navigation doesn't remove "undefined" values from the params object, and you cannot remove them via
      // navigation.setParams as it shallow merges. Hence, we hide them here
      if (value === undefined) {
        return [key, undefined];
      }

      if (Array.isArray(value)) {
        return [
          key,
          value.map((v) => {
            try {
              return decodeURIComponent(v);
            } catch {
              return v;
            }
          }),
        ];
      } else {
        try {
          return [key, decodeURIComponent(value as string)];
        } catch {
          return [key, value];
        }
      }
    })
  ) as any;
}

export function useSearchParams({ global = false } = {}): URLSearchParams {
  const globalRef = React.useRef(global);
  if (process.env.NODE_ENV !== 'production') {
    if (global !== globalRef.current) {
      console.warn(
        `Detected change in 'global' option of useSearchParams. This value cannot change between renders`
      );
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = global ? useGlobalSearchParams() : useLocalSearchParams();
  const entries = Object.entries(params).flatMap(([key, value]) => {
    if (global) {
      if (key === 'params') return [];
      if (key === 'screen') return [];
    }

    return Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]];
  });

  return new ReadOnlyURLSearchParams(entries);
}

class ReadOnlyURLSearchParams extends URLSearchParams {
  set() {
    throw new Error('The URLSearchParams object return from useSearchParams is read-only');
  }
  append() {
    throw new Error('The URLSearchParams object return from useSearchParams is read-only');
  }
  delete() {
    throw new Error('The URLSearchParams object return from useSearchParams is read-only');
  }
}

const loaderDataCache = new Map<string, any>();
const loaderPromiseCache = new Map<string, Promise<any>>();
const loaderErrorCache = new Map<string, Error>();

type LoaderFunctionResult<T extends LoaderFunction<any>> =
  T extends LoaderFunction<infer R> ? R : unknown;

/**
 * Returns the result of the `loader` function for the calling route.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLoaderData } from 'expo-router';
 *
 * export function loader() {
 *   return Promise.resolve({ foo: 'bar' }}
 * }
 *
 * export default function Route() {
 *  // { foo: 'bar' }
 *  const data = useLoaderData<typeof loader>();
 *
 *  return <Text>Data: {JSON.stringify(data)}</Text>;
 * }
 */
export function useLoaderData<T extends LoaderFunction<any> = any>(): LoaderFunctionResult<T> {
  const routeNode = useRouteNode();
  const params = useLocalSearchParams();
  const serverDataLoaderContext = use(ServerDataLoaderContext);

  if (!routeNode) {
    throw new Error('No route node found. This is likely a bug in expo-router.');
  }

  const resolvedPath = `/${resolveHref({ pathname: routeNode?.route, params })}`;

  // First invocation of this hook will happen server-side, so we look up the loaded data from context
  if (serverDataLoaderContext) {
    return serverDataLoaderContext[resolvedPath];
  }

  // The second invocation happens after the client has hydrated on initial load, so we look up the data injected
  // by `<PreloadedDataScript />` using `globalThis.__EXPO_ROUTER_LOADER_DATA__`
  if (typeof window !== 'undefined' && globalThis.__EXPO_ROUTER_LOADER_DATA__) {
    if (globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath]) {
      return globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath];
    }
  }

  // Check error cache first to prevent infinite retry loops when a loader fails.
  // We throw the cached error instead of starting a new fetch.
  if (loaderErrorCache.has(resolvedPath)) {
    // eslint-disable-next-line no-throw-literal
    throw loaderErrorCache.get(resolvedPath) as Error;
  }

  // Check cache for route data
  if (loaderDataCache.has(resolvedPath)) {
    return loaderDataCache.get(resolvedPath);
  }

  // Fetch data if not cached
  if (!loaderPromiseCache.has(resolvedPath)) {
    const promise = fetchLoaderModule(resolvedPath)
      .then((data) => {
        loaderDataCache.set(resolvedPath, data);
        loaderErrorCache.delete(resolvedPath); // Clear any previous error
        loaderPromiseCache.delete(resolvedPath);
        return data;
      })
      .catch((error) => {
        const wrappedError = new Error(`Failed to load loader data for route: ${resolvedPath}`, {
          cause: error,
        });
        loaderErrorCache.set(resolvedPath, wrappedError); // Cache the error
        loaderPromiseCache.delete(resolvedPath);
        throw wrappedError;
      });

    loaderPromiseCache.set(resolvedPath, promise);
  }

  return use(loaderPromiseCache.get(resolvedPath)!);
}
