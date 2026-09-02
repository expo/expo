/**
 * Navigators
 */
/**
 * @deprecated Reserved for libraries that ship a self-contained navigator, which the `Stack` layout
 * cannot express. There is no stable replacement yet, so expect this factory to change or be removed
 * in a future release. App code should use `Stack` from `expo-router`.
 */
export { createNativeStackNavigator } from './navigators/createNativeStackNavigator';

/**
 * Views
 */
export { NativeStackView } from './views/NativeStackView';

/**
 * Hooks
 */
export { useAnimatedHeaderHeight } from './utils/useAnimatedHeaderHeight';
export { makePopAction } from './utils/makePopAction';

/**
 * Types
 */
export type {
  NativeStackEmit,
  NativeStackHeaderBackProps,
  NativeStackHeaderItem,
  NativeStackHeaderItemButton,
  NativeStackHeaderItemCustom,
  NativeStackHeaderItemMenu,
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
  NativeStackHeaderItemProps,
  NativeStackHeaderItemSpacing,
  NativeStackHeaderLeftProps,
  NativeStackHeaderProps,
  NativeStackHeaderRightProps,
  NativeStackHeaderNativeProps,
  NativeStackNativeProps,
  NativeStackNavigationEventMap,
  NativeStackDescriptorMap,
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
  NativeStackNavigatorProps,
  NativeStackOptionsArgs,
  NativeStackScreenNativeProps,
  NativeStackScreenProps,
  NativeStackViewEmit,
  NativeStackViewState,
} from './types';
