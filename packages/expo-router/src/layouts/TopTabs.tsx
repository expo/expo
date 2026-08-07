import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import TopTabs from './TopTabsClient';

TopTabs.Screen = Screen;
TopTabs.Protected = Protected;

export { TopTabs };

export {
  createStandardMaterialTopTabNavigator,
  MaterialTopTabBar,
  MaterialTopTabView,
  useTabAnimation,
} from './TopTabsClient';
export type {
  MaterialTopTabBarProps,
  MaterialTopTabEmitter,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp,
  MaterialTopTabOptionsArgs,
  MaterialTopTabScreenProps,
  MaterialTopTabViewState,
} from '../react-navigation/material-top-tabs';
export type { JSTopTabsProps } from './TopTabsClient';

export default TopTabs;
