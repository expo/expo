'use client';

import type { DrawerNavigationOptions, DrawerNavigationEventMap } from '../react-navigation/drawer';
import { createDrawerNavigator } from '../react-navigation/drawer';
import type { DrawerNavigationState, ParamListBase } from '../react-navigation/native';
import { withLayoutContext } from './withLayoutContext';

const DrawerNavigator = createDrawerNavigator().Navigator;

/**
 * A layout that renders its child routes inside a side drawer navigator. Use it in a `_layout`
 * file and declare each drawer entry with a nested `Drawer.Screen`. Open the drawer imperatively
 * with `navigation.openDrawer()` from `useNavigation`, or swipe from the screen edge.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { Drawer } from 'expo-router/drawer';
 *
 * export default function Layout() {
 *   return (
 *     <Drawer>
 *       <Drawer.Screen name="index" options={{ title: 'Home' }} />
 *       <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
 *     </Drawer>
 *   );
 * }
 * ```
 */
export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof DrawerNavigator,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(DrawerNavigator);

export default Drawer;
