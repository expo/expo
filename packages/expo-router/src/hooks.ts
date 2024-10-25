import React from 'react';

import { LocalRouteParamsContext } from './Route';
import { store, useStoreRootState, useStoreRouteInfo } from './global-state/router-store';
import { Router } from './imperative-api';
import { RouteParams, RouteSegments, Routes, UnknownOutputParams } from './types';

type SearchParams = Record<string, string | string[]>;
export function useRootNavigationState() {
  return useStoreRootState();
}

export function useRouteInfo() {
  return useStoreRouteInfo();
}

/** @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead, which returns a React `ref`. */
export function useRootNavigation() {
  return store.navigationRef.current;
}

/** @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null` if the `<NavigationContainer />` hasn't mounted yet. */
export function useNavigationContainerRef() {
  return store.navigationRef;
}

export function useRouter(): Router {
  return React.useMemo(
    () => ({
      push: store.push,
      dismiss: store.dismiss,
      dismissAll: store.dismissAll,
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
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
export function useUnstableGlobalHref(): string {
  return useStoreRouteInfo().unstable_globalHref;
}

/**
 * Get a list of selected file segments for the currently selected route. Segments are not normalized, so they will be the same as the file path. For example: `/[id]?id=normal -> ["[id]"]`.
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
 * `useSegments` can be typed using an abstract. Consider the following file structure, and strictly typed `useSegments` function:
 *
 * ```md
 * - app
 *   - [user]
 *     - index.js
 *     - followers.js
 *   - settings.js
 * ```
 *
 *
 * This can be strictly typed using the following abstract:
 *
 * ```ts
 * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
 * ```
 */
export function useSegments<
  TSegments extends Routes | RouteSegments<Routes> = Routes,
>(): TSegments extends string ? RouteSegments<TSegments> : TSegments {
  return useStoreRouteInfo().segments as TSegments extends string
    ? RouteSegments<TSegments>
    : TSegments;
}

/**
 * Global selected route location without search parameters. For example, `/acme?foo=bar` -> `/acme`. Segments will be normalized: `/[id]?id=normal` -> `/normal`.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useSegments } from 'expo-router';
 *
 * export default function Route() {
 *   // segments = ["profile", "[user]"]</b>
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
 * @hidden
 */
export function useGlobalSearchParams<
  TParams extends SearchParams = UnknownOutputParams,
>(): RouteParams<TParams>;
/**
 * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
 * Useful for analytics or other background operations that don't draw to the screen.
 *
 * When querying search params in a stack, opt-towards using [`useLocalSearchParams`](#uselocalsearchparams) as these will only update when the route is focused.
 *
 * Route URL example: `acme://profile/baconbrix?extra=info`.
 *
 * > **Note:** See [local versus global search parameters](/router/reference/search-parameters/#local-versus-global-search-parameters) for usage
 * > information.
 *
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useGlobalSearchParams } from 'expo-router';
 *
 * export default function Route() {
 *   // user=baconbrix & extra=info
 *   const { user, extra } = useGlobalSearchParams();
 *   return <Text>User: {user}</Text>;
 * }
 * ```
 *
 */
export function useGlobalSearchParams<
  TRoute extends Routes,
  TParams extends SearchParams = UnknownOutputParams,
>(): RouteParams<TRoute, TParams>;
export function useGlobalSearchParams<
  TParams1 extends SearchParams | Routes = UnknownOutputParams,
  TParams2 extends SearchParams = UnknownOutputParams,
>(): RouteParams<TParams1, TParams2> {
  return useStoreRouteInfo().params as RouteParams<TParams1, TParams2>;
}

/**
 * @hidden
 */
export function useLocalSearchParams<
  TParams extends SearchParams = UnknownOutputParams,
>(): RouteParams<TParams>;
/**
 * Returns the URL parameters for the contextually focused route. e.g. `/acme?foo=bar` -> `{ foo: "bar" }`.
 * This is useful for stacks where you may push a new screen that changes the query parameters.
 * For dynamic routes, both the route parameters and the search parameters are returned.
 *
 * To observe updates even when the invoking route is not focused, use `useGlobalSearchParams()`.
 *
 * @see [`useGlobalSearchParams`](#useglobalsearchparams)
 */
export function useLocalSearchParams<
  TRoute extends Routes,
  TParams extends SearchParams = UnknownOutputParams,
>(): RouteParams<TRoute, TParams>;
export function useLocalSearchParams<
  TParams1 extends SearchParams | Routes = UnknownOutputParams,
  TParams2 extends SearchParams = UnknownOutputParams,
>(): RouteParams<TParams1, TParams2> {
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
  ) as RouteParams<TParams1, TParams2>;
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
