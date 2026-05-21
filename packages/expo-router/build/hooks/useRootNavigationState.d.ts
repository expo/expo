import type { NavigationState } from '../react-navigation/native';
/**
 * Returns the navigation state of the root navigator — the top-level navigator that
 * contains the current screen.
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
 *
 * @returns The current `NavigationState` of the root navigator.
 *
 * @see React Navigation's [navigation state](https://reactnavigation.org/docs/navigation-state/)
 * reference for the shape of the returned object.
 */
export declare function useRootNavigationState(): NavigationState;
//# sourceMappingURL=useRootNavigationState.d.ts.map