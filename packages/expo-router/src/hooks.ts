'use client';

import React from 'react';

import { LocalRouteParamsContext } from './Route';
import { store, useStoreRootState, useStoreRouteInfo } from './global-state/router-store';
import { Router } from './imperative-api';
import { RouteParams, RouteSegments, UnknownOutputParams, Route } from './types';

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
  return useStoreRootState();
}

export function useRouteInfo() {
  return useStoreRouteInfo();
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
  return React.useMemo(
    () => ({
      push: store.push,
      dismiss: store.dismiss,
      dismissAll: store.dismissAll,
      dismissTo: store.dismissTo,
      canDismiss: store.canDismiss,
      back: store.goBack,
      replace: store.replace,
      setParams: store.setParams,
      canGoBack: store.canGoBack,
      navigate: store.navigate,
      reload: store.reload,
    }),
    []
  );
}

/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
export function useUnstableGlobalHref(): string {
  return useStoreRouteInfo().unstable_globalHref;
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
export function useSegments<TSegments extends RouteSegments<Route>>(): TSegments;
export function useSegments() {
  return useStoreRouteInfo().segments;
}

/**
 * Returns the currently selected route location without search parameters. For example, `/acme?foo=bar` returns `/acme`.
 * Segments will be normalized. For example, `/[id]?id=normal` becomes `/normal`.
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
 */
export function usePathname(): string {
  return useStoreRouteInfo().pathname;
}

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
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): TParams;
export function useGlobalSearchParams<TRoute extends Route>(): RouteParams<TRoute>;
export function useGlobalSearchParams<
  TRoute extends Route,
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): RouteParams<TRoute> & TParams;
export function useGlobalSearchParams() {
  return useStoreRouteInfo().params;
}

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
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): TParams;
export function useLocalSearchParams<TRoute extends Route>(): RouteParams<TRoute>;
export function useLocalSearchParams<
  TRoute extends Route,
  TParams extends UnknownOutputParams = UnknownOutputParams,
>(): RouteParams<TRoute> & TParams;
export function useLocalSearchParams() {
  const params = React.useContext(LocalRouteParamsContext) ?? {};
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
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
