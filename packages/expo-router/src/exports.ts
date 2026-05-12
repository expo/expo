// Expo Router API
import { Navigator, Slot } from './views/Navigator';

export {
  useRouter,
  useUnstableGlobalHref,
  usePathname,
  useNavigationContainerRef,
  useGlobalSearchParams,
  useLocalSearchParams,
  useSegments,
  useRootNavigation,
  useRootNavigationState,
  useLoaderData,
  useCurrentRouteInfo,
} from './hooks';

export { router, type ImperativeRouter } from './imperative-api';

export { withLayoutContext } from './layouts/withLayoutContext';
export { Navigator, Slot };

// Expo Router Views
export { ExpoRoot } from './ExpoRoot';
export { Unmatched } from './views/Unmatched';
export { Sitemap } from './views/Sitemap';
export { useSitemap, type SitemapType } from './views/useSitemap';
export type { ErrorBoundaryProps } from './views/Try';
export { ErrorBoundary } from './views/ErrorBoundary';
export { SuspenseFallback, type SuspenseFallbackProps } from './views/SuspenseFallback';
export type { ScreenProps } from './useScreens';

// Platform
/**
 * @hidden
 */
export * as SplashScreen from './views/Splash';

// React Navigation
export { useNavigation } from './useNavigation';
export { useFocusEffect, type EffectCallback } from './useFocusEffect';
export { useIsFocused } from './useIsFocused';
export type { ResultState } from './fork/getStateFromPath';

export { DarkTheme } from './react-navigation/native/theming/DarkTheme';
export { DefaultTheme } from './react-navigation/native/theming/DefaultTheme';
export { ThemeProvider } from './react-navigation/core/theming/ThemeProvider';
export { useTheme } from './react-navigation/core/theming/useTheme';
export { useRoutePath } from './react-navigation/native/useRoutePath';
export { useScrollToTop } from './react-navigation/native/useScrollToTop';
export { useRoute } from './react-navigation/core/useRoute';

export type { RedirectConfig } from './getRoutesCore';
export type { SingularOptions } from './useScreens';

export type * from './types';

export {
  Badge,
  type BadgeProps,
  Icon,
  type IconProps,
  Label,
  type LabelProps,
  VectorIcon,
  type VectorIconProps,
} from './primitives';

export { unstable_navigationEvents } from './navigationEvents';

/**
 * @deprecated Use `import { Tabs } from 'expo-router/js-tabs'` instead.
 */
export { Tabs } from './layouts/Tabs';

export { ExperimentalStack } from './layouts/experimental-stack';
export type {
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationProp,
  ExperimentalStackScreenProps,
} from './layouts/experimental-stack';
