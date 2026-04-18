'use client';
import { withLayoutContext } from './withLayoutContext';
import { createDrawerNavigator, } from '../react-navigation/drawer';
const DrawerNavigator = createDrawerNavigator().Navigator;
export const Drawer = withLayoutContext(DrawerNavigator);
export default Drawer;
//# sourceMappingURL=DrawerClient.js.map