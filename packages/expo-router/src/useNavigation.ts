'use client';
import { useNavigation as useUpstreamNavigation, NavigationProp } from '@react-navigation/native';
import React from 'react';

import { useContextKey } from './Route';
import { getNameFromFilePath } from './matchers';

/**
 * Access the underlying React Navigation [`navigation` prop](https://reactnavigation.org/docs/navigation-prop) to imperatively access layout-specific functionality like `navigation.openDrawer()` in a Drawer layout.
 *
 * @example
 * ```tsx
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
 * When using nested layouts, you can access higher-order layouts by passing a secondary argument denoting the layout route. For example, `/menu/_layout.tsx` is nested inside `/app/orders/`, you can use `useNavigation('/orders/menu/')`.
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
 * If you attempt to access a layout that doesn't exist, an error such as `Could not find parent navigation with route "/non-existent"` is thrown.
 *
 * See React Navigation documentation on [navigation dependent functions](https://reactnavigation.org/docs/navigation-prop/#navigator-dependent-functions) for more information.
 *
 * @param parent Provide an absolute path such as `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns The navigation object for the current route.
 */
export function useNavigation<T = NavigationProp<ReactNavigation.RootParamList>>(
  parent?: string
): T {
  const navigation = useUpstreamNavigation<any>();

  const contextKey = useContextKey();
  const normalizedParent = React.useMemo(() => {
    if (!parent) {
      return null;
    }
    const normalized = getNameFromFilePath(parent);

    if (parent.startsWith('.')) {
      return relativePaths(contextKey, parent);
    }
    return normalized;
  }, [contextKey, parent]);

  if (normalizedParent != null) {
    const parentNavigation = navigation.getParent(normalizedParent);

    // TODO: Maybe print a list of parents...

    if (!parentNavigation) {
      throw new Error(
        `Could not find parent navigation with route "${parent}".` +
          (normalizedParent !== parent ? ` (normalized: ${normalizedParent})` : '')
      );
    }
    return parentNavigation;
  }
  return navigation;
}

export function resolveParentId(contextKey: string, parentId?: string | null): string | null {
  if (!parentId) {
    return null;
  }

  if (parentId.startsWith('.')) {
    return getNameFromFilePath(relativePaths(contextKey, parentId));
  }
  return getNameFromFilePath(parentId);
}

// Resolve a path like `../` relative to a path like `/foo/bar`
function relativePaths(from: string, to: string): string {
  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);

  for (const part of toParts) {
    if (part === '..') {
      if (fromParts.length === 0) {
        throw new Error(`Cannot resolve path "${to}" relative to "${from}"`);
      }
      fromParts.pop();
    } else if (part === '.') {
      // Ignore
    } else {
      fromParts.push(part);
    }
  }

  return '/' + fromParts.join('/');
}
