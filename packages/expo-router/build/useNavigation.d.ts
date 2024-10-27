import { NavigationProp } from '@react-navigation/native';
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
export declare function useNavigation<T = NavigationProp<ReactNavigation.RootParamList>>(parent?: string): T;
export declare function resolveParentId(contextKey: string, parentId?: string | null): string | null;
//# sourceMappingURL=useNavigation.d.ts.map