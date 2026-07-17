'use client';

import { useMemo } from 'react';

import {
  navigate as hrefNavigate,
  push as hrefPush,
  replace as hrefReplace,
} from './global-state/router';
import { getRootStackRouteNames } from './global-state/utils';
import { resolveHref } from './link/href';
import { useIsPreview } from './link/preview/PreviewRouteContext';
import type { NavigationProp, NavigationState } from './react-navigation/native';
import {
  useNavigation as useUpstreamNavigation,
  useLinkBuilder,
  useStateForPath,
} from './react-navigation/native';
import type { Href } from './types';

// Route the current route's `navigate`/`push`/`replace` through the href pipeline
// (`router.*` → `getNavigateAction` → `payload.state`) so all navigation shares one path under the
// hood. `useLinkBuilder().buildHref` reuses the same name-relative-to-current-route resolution that
// `<Link>` uses — it substitutes the current navigator's focused route (see `useBuildHref`) rather
// than appending to the URL. Only the current-route navigation object is wrapped: `buildHref`
// resolves relative to the current route, so a `getParent()` target keeps the upstream methods.
// Navigate options (merge/pop) aren't forwarded — the href pipeline owns that behavior. When
// linking is disabled `buildHref` returns `undefined`, so we fall back to the upstream method.
function withHrefNavigation<T extends { navigate: (...args: any[]) => void }>(
  navigation: T,
  buildHref: (name: string, params?: object) => string | undefined
): T {
  const resolveHrefFromArgs = (nameOrOptions: unknown, params?: object): string | undefined => {
    if (typeof nameOrOptions === 'string') {
      return buildHref(nameOrOptions, params);
    }
    if (
      nameOrOptions != null &&
      typeof nameOrOptions === 'object' &&
      'name' in nameOrOptions &&
      typeof nameOrOptions.name === 'string'
    ) {
      return buildHref(
        nameOrOptions.name,
        'params' in nameOrOptions ? (nameOrOptions.params as object) : undefined
      );
    }
    return undefined;
  };

  const throughHref =
    (hrefFn: (href: Href) => void, fallback: (...args: any[]) => void) =>
    (...args: any[]) => {
      const href = resolveHrefFromArgs(args[0], args[1] as object);
      if (href != null) {
        hrefFn(href);
        return;
      }
      fallback(...args);
    };

  const wrapped = {
    ...navigation,
    navigate: throughHref(hrefNavigate, navigation.navigate.bind(navigation)),
  } as T & { push?: unknown; replace?: unknown };

  if (typeof (navigation as { push?: unknown }).push === 'function') {
    wrapped.push = throughHref(hrefPush, (navigation as any).push.bind(navigation));
  }
  if (typeof (navigation as { replace?: unknown }).replace === 'function') {
    wrapped.replace = throughHref(hrefReplace, (navigation as any).replace.bind(navigation));
  }

  return wrapped;
}

/**
 * Returns the navigation object for the current route. Mirrors the React Navigation
 * [`navigation` object](https://reactnavigation.org/docs/navigation-object). Use it to
 * imperatively dispatch navigation actions. To control a [Drawer](/router/advanced/drawer/)
 * layout, use the `useDrawerActions()` hook from `expo-router/drawer` instead.
 *
 * @example
 * ```tsx app/index.tsx
 * import { useNavigation } from 'expo-router';
 *
 * export default function Route() {
 *   // Access the current navigation object for the current route.
 *   const navigation = useNavigation();
 *
 *   return (
 *     <View>
 *       <Text onPress={() => navigation.goBack()}>Go back</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * When using nested layouts, you can access higher-order layouts by passing a secondary argument denoting the layout route.
 * For example, `/menu/_layout.tsx` is nested inside `/app/orders/`, you can use `useNavigation('/orders/menu/')`.
 *
 * @example
 * ```tsx app/orders/menu/index.tsx
 * import { useNavigation } from 'expo-router';
 *
 * export default function MenuRoute() {
 *   const rootLayout = useNavigation('/');
 *   const ordersLayout = useNavigation('/orders');
 *
 *   // Same as the default results of `useNavigation()` when invoked in this route.
 *   const parentLayout = useNavigation('/orders/menu');
 * }
 * ```
 *
 * If you attempt to access a layout that doesn't exist, an error such as
 * `Could not find parent navigation with route "/non-existent"` is thrown.
 *
 *
 * @param parent Provide an absolute path such as `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns The navigation object for the current route.
 *
 * @see The full navigation API is available directly from `expo-router` — no
 * `@react-navigation/*` install required. For the navigator-dependent functions reference,
 * see [navigation dependent functions](https://reactnavigation.org/docs/navigation-object/#navigator-dependent-functions).
 */
export function useNavigation<
  T = Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
    getState(): NavigationState | undefined;
  },
>(parent?: string | Href): T {
  const rnNavigation = useUpstreamNavigation<any>();
  const { buildHref } = useLinkBuilder();
  // Inside a preview, `useUpstreamNavigation` yields a guarded no-op navigation object (see
  // `HrefPreview`); leave it untouched so navigation stays a no-op-with-warning during a preview.
  const isPreview = useIsPreview();
  let navigation = rnNavigation;
  let state = useStateForPath();

  const currentNavigation = useMemo(
    () => (isPreview ? rnNavigation : withHrefNavigation(rnNavigation, buildHref)),
    [isPreview, rnNavigation, buildHref]
  );

  if (parent === undefined) {
    // If no parent is provided, return the current navigation object (navigate/push/replace routed
    // through the href pipeline).
    return currentNavigation as T;
  }

  // Check for the top-level navigator - we cannot fetch anything higher!
  const currentId = navigation.getId();
  if (currentId === '' || currentId === `/expo-router/build/views/Navigator`) {
    return navigation;
  }

  if (typeof parent === 'object') {
    parent = resolveHref(parent);
  }

  if (parent === '/') {
    // This is the root navigator
    return navigation.getParent(`/expo-router/build/views/Navigator`) ?? navigation.getParent(``);
  } else if (parent?.startsWith('../')) {
    const names: string[] = [];

    while (state) {
      const route = state.routes[0];
      state = route.state;
      // Don't include the last router, as thats the current route
      if (state) {
        names.push(route.name);
      }
    }

    // Removing the trailing slash to make splitting easier
    const originalParent = parent;
    if (parent.endsWith('/')) {
      parent = parent.slice(0, -1);
    }

    const segments = parent.split('/');
    if (!segments.every((segment) => segment === '..')) {
      throw new Error(
        `Invalid parent path "${originalParent}". Only "../" segments are allowed when using relative paths.`
      );
    }

    const levels = segments.length;
    const index = names.length - 1 - levels;

    if (index < 0) {
      throw new Error(
        `Invalid parent path "${originalParent}". Cannot go up ${levels} levels from the current route.`
      );
    }

    parent = names[index];

    // Expo Router navigators use the context key as the name which has a leading `/`
    // The exception to this are the root stack routes, and the root navigator which uses ''
    if (parent && !getRootStackRouteNames().includes(parent)) {
      parent = `/${parent}`;
    }
  }

  navigation = navigation.getParent(parent);

  if (process.env.NODE_ENV !== 'production') {
    if (!navigation) {
      navigation = rnNavigation;
      const ids: (string | undefined)[] = [];
      while (navigation) {
        if (navigation.getId()) ids.push(navigation.getId());
        navigation = navigation.getParent();
      }

      throw new Error(
        `Could not find parent navigation with route "${parent}". Available routes are: '${ids.join("', '")}'`
      );
    }
  }

  return navigation;
}
