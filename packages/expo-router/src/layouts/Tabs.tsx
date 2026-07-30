import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import Tabs from './TabsClient';

export {
  createBottomTabNavigator,
  BottomTabBar,
  BottomTabView,
  BottomTabBarHeightCallbackContext,
  BottomTabBarHeightContext,
  useBottomTabBarHeight,
} from './TabsClient';
export * as SceneStyleInterpolators from '../react-navigation/bottom-tabs/TransitionConfigs/SceneStyleInterpolators';
export * as TransitionPresets from '../react-navigation/bottom-tabs/TransitionConfigs/TransitionPresets';
export * as TransitionSpecs from '../react-navigation/bottom-tabs/TransitionConfigs/TransitionSpecs';
export type {
  BottomTabBarButtonProps,
  BottomTabBarProps,
  BottomTabHeaderProps,
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
  BottomTabNavigatorProps,
  BottomTabOptionsArgs,
  BottomTabScreenProps,
} from '../react-navigation/bottom-tabs';

Tabs.Screen = Screen;
Tabs.Protected = Protected;

export { Tabs };

export default Tabs;
