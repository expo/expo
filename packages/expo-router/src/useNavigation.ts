'use client';
import {
  useNavigation as useUpstreamNavigation,
  NavigationProp,
  NavigationState,
} from '@react-navigation/native';
import React from 'react';

import { store } from './global-state/router-store';
import { useSegments } from './hooks';
import { resolveHref } from './link/href';
import { Href } from './types';

/**
 * Returns the underlying React Navigation [`navigation` prop](https://reactnavigation.org/docs/navigation-prop)
 * to imperatively access layout-specific functionality like `navigation.openDrawer()` in a
 * [Drawer](/router/advanced/drawer/) layout.
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
 *       <Text onPress={() => {
 *         // Open the drawer view.
 *         navigation.openDrawer();
 *       }}>
 *         Open Drawer
 *       </Text>
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
 * @see React Navigation documentation on [navigation dependent functions](https://reactnavigation.org/docs/navigation-prop/#navigator-dependent-functions)
 * for more information.
 */
export function useNavigation<
  T = Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
    getState(): NavigationState | undefined;
  },
>(parent?: string | Href): T {
  let navigation = useUpstreamNavigation<any>();
  const initialNavigation = navigation;
  const segments = useSegments();

  const targetNavigatorContextKey = React.useMemo(() => {
    if (!parent) {
      return;
    }

    if (typeof parent === 'object') {
      parent = resolveHref(parent);
    }

    if (parent === '/') {
      return '';
    }

    let state = store.getStateFromPath(parent.startsWith('../') ? segments.join('/') : parent);

    // Reconstruct the context key from the state
    let contextKey = '';
    const names: string[] = [];

    while (state) {
      const routes = state.routes;
      const route = routes[state.index ?? routes.length - 1];

      if (route.state) {
        contextKey = `${contextKey}/${route.name}`;
        names.push(route.name);

        if (parent === contextKey) {
          break;
        }

        state = route.state;
      } else {
        break;
      }
    }

    if (parent.startsWith('../')) {
      const parentSegments = parent.split('/').filter(Boolean);

      for (const segment of parentSegments) {
        if (segment === '..') {
          names.pop();
        } else {
          throw new Error(
            "Relative parent paths may only contain '..' and cannot contain other segments"
          );
        }
      }

      contextKey = names.length > 0 ? `/${names.join('/')}` : '';
    }

    return contextKey;
  }, [segments, parent]);

  if (targetNavigatorContextKey !== undefined) {
    navigation = navigation.getParent(targetNavigatorContextKey as any);
  }

  if (!navigation) {
    const ids: (string | undefined)[] = [];

    navigation = initialNavigation;

    while (navigation) {
      ids.push(navigation.getId() || '/');
      navigation = navigation.getParent();
    }

    throw new Error(
      `Could not find parent navigation with route "${parent}". Available routes are: '${ids.join("', '")}'`
    );
  }

  return navigation;
}
