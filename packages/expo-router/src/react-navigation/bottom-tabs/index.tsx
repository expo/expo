import * as SceneStyleInterpolators from './TransitionConfigs/SceneStyleInterpolators';
import * as TransitionPresets from './TransitionConfigs/TransitionPresets';
import * as TransitionSpecs from './TransitionConfigs/TransitionSpecs';

/**
 * Transition Presets
 */
export { SceneStyleInterpolators, TransitionPresets, TransitionSpecs };

/**
 * Views
 */
export { BottomTabBar } from './views/BottomTabBar';
export { BottomTabView } from './views/BottomTabView';

/**
 * Utilities
 */
export { BottomTabBarHeightCallbackContext } from './utils/BottomTabBarHeightCallbackContext';
export { BottomTabBarHeightContext } from './utils/BottomTabBarHeightContext';
export { useBottomTabBarHeight } from './utils/useBottomTabBarHeight';

/**
 * Navigators
 */
/**
 * @unstable Prefer the `Tabs` layout.
 */
export { createStandardBottomTabNavigator } from './navigators/createBottomTabNavigator';

/**
 * Types
 */
export type {
  BottomTabBarButtonProps,
  BottomTabBarProps,
  BottomTabEmitter,
  BottomTabHeaderProps,
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
  BottomTabOptionsArgs,
  BottomTabScreenProps,
  BottomTabViewState,
} from './types';
