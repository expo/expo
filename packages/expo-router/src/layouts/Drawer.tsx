import {
  createDrawerNavigator,
  DrawerNavigationOptions,
} from "@react-navigation/drawer";

import { withLayoutContext } from "./withLayoutContext";

const DrawerNavigator = createDrawerNavigator().Navigator;

export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof DrawerNavigator
>(DrawerNavigator);

export default Drawer;
