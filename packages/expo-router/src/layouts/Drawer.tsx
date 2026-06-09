import Drawer from './DrawerClient';
import { Screen } from '../views/Screen';

// Re-export the drawer building blocks (content components, items, types, etc.) from the
// vendored react-navigation so apps can build custom `drawerContent` without depending on
// `@react-navigation/drawer` directly. See https://github.com/expo/expo/issues/46161
// `createDrawerNavigator` is intentionally omitted — use the `Drawer` layout instead.
// The `DrawerStatusContext`/`DrawerProgressContext` contexts are also omitted — use the
// `useDrawerStatus`/`useDrawerProgress` hooks instead.
export {
  DrawerContent,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  DrawerToggleButton,
  DrawerView,
  getDrawerStatusFromState,
  useDrawerStatus,
  useDrawerProgress,
} from '../react-navigation/drawer';
export type {
  DrawerContentComponentProps,
  DrawerHeaderProps,
  DrawerNavigationEventMap,
  DrawerNavigationOptions,
  DrawerNavigationProp,
  DrawerNavigatorProps,
  DrawerOptionsArgs,
  DrawerScreenProps,
} from '../react-navigation/drawer';

Drawer.Screen = Screen;

export { Drawer };

export default Drawer;
