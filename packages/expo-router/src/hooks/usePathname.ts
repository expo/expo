'use client';

import { useRouteInfo } from '../global-state/useRouteInfo';

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
