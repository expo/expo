import * as CardStyleInterpolators from './TransitionConfigs/CardStyleInterpolators';
import * as HeaderStyleInterpolators from './TransitionConfigs/HeaderStyleInterpolators';
import * as TransitionPresets from './TransitionConfigs/TransitionPresets';
import * as TransitionSpecs from './TransitionConfigs/TransitionSpecs';

/**
 * Navigators
 */
export { createStackNavigator } from './navigators/createStackNavigator';

/**
 * Views
 */
export { Header } from './views/Header/Header';
export { StackView } from './views/Stack/StackView';

/**
 * Transition presets
 */
export {
  CardStyleInterpolators,
  HeaderStyleInterpolators,
  TransitionPresets,
  TransitionSpecs,
};

/**
 * Utilities
 */
export { CardAnimationContext } from './utils/CardAnimationContext';
export { GestureHandlerRefContext } from './utils/GestureHandlerRefContext';
export { useCardAnimation } from './utils/useCardAnimation';
export { useGestureHandlerRef } from './utils/useGestureHandlerRef';

/**
 * Types
 */
export type {
  StackAnimationName,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  StackHeaderInterpolatedStyle,
  StackHeaderInterpolationProps,
  StackHeaderLeftProps,
  StackHeaderProps,
  StackHeaderRightProps,
  StackHeaderStyleInterpolator,
  StackNavigationEventMap,
  StackNavigationOptions,
  StackNavigationProp,
  StackNavigatorProps,
  StackOptionsArgs,
  StackScreenProps,
  TransitionPreset,
} from './types';
