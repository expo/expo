import { createDrawerNavigator, } from '@react-navigation/drawer';
import { withLayoutContext } from './withLayoutContext';
const DrawerNavigator = createDrawerNavigator().Navigator;
export const Drawer = withLayoutContext(DrawerNavigator);
export default Drawer;
//# sourceMappingURL=Drawer.js.map