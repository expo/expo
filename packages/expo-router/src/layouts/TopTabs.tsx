import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import TopTabs from './TopTabsClient';

TopTabs.Screen = Screen;
TopTabs.Protected = Protected;

export { TopTabs };

export {
  createMaterialTopTabNavigator,
  MaterialTopTabBar,
  MaterialTopTabView,
  useTabAnimation,
} from './TopTabsClient';
export type {
  MaterialTopTabBarProps,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp,
  MaterialTopTabNavigatorProps,
  MaterialTopTabOptionsArgs,
  MaterialTopTabScreenProps,
} from '../react-navigation/material-top-tabs';

export default TopTabs;
