'use client';
import {
  useNavigation as useUpstreamNavigation,
  NavigationProp,
  NavigationState,
  useStateForPath,
} from '@react-navigation/native';

import { INTERNAL_SLOT_NAME } from './constants';
import { resolveHref } from './link/href';
import { Href } from './types';

/**
 * Returns the underlying React Navigation [`navigation` object](https://reactnavigation.org/docs/navigation-object)
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
 * @see React Navigation documentation on [navigation dependent functions](https://reactnavigation.org/docs/navigation-object/#navigator-dependent-functions)
 * for more information.
 */
export function useNavigation<
  T = Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
    getState(): NavigationState | undefined;
  },
>(parent?: string | Href): T {
  let navigation = useUpstreamNavigation<any>();
  let state = useStateForPath();

  if (parent === undefined) {
    // If no parent is provided, return the current navigation object
    return navigation;
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
    // The exception to this is the INTERNAL_SLOT_NAME, and the root navigator which uses ''
    if (parent && parent !== INTERNAL_SLOT_NAME) {
      parent = `/${parent}`;
    }
  }

  navigation = navigation.getParent(parent);

  if (process.env.NODE_ENV !== 'production') {
    if (!navigation) {
      const ids: (string | undefined)[] = [];
      while (navigation) {
        ids.push(navigation.getId() || '/');
        navigation = navigation.getParent();
      }

      throw new Error(
        `Could not find parent navigation with route "${parent}". Available routes are: '${ids.join("', '")}'`
      );
    }
  }

  return navigation;
}
