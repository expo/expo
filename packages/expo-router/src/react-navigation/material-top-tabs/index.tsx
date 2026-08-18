import { MaterialTopTabView } from './views/MaterialTopTabView';

/**
 * > **warning** This API is unstable and may change between minor releases.
 */
export { createStandardMaterialTopTabNavigator } from './navigators/createMaterialTopTabNavigator';

/**
 * Views
 */
export { MaterialTopTabBar } from './views/MaterialTopTabBar';
export { MaterialTopTabView };

/**
 * Utilities
 */
export { useTabAnimation } from './utils/useTabAnimation';

/**
 * Types
 */
export type {
  MaterialTopTabBarProps,
  MaterialTopTabEmitter,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp,
  MaterialTopTabOptionsArgs,
  MaterialTopTabScreenProps,
  MaterialTopTabViewState,
} from './types';
