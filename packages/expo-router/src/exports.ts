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
} from './hooks';

export { router, Router } from './imperative-api';

export { Link, LinkProps, WebAnchorProps } from './link/Link';
export { Redirect, RedirectProps } from './link/Redirect';

export { withLayoutContext } from './layouts/withLayoutContext';
export { Navigator, Slot };

// Expo Router Views
export { ExpoRoot } from './ExpoRoot';
export { Unmatched } from './views/Unmatched';
export { Sitemap } from './views/Sitemap';
export { ErrorBoundaryProps } from './views/Try';
export { ErrorBoundary } from './views/ErrorBoundary';
export type { ScreenProps } from './useScreens';

// Platform
/**
 * @hidden
 */
export * as SplashScreen from './views/Splash';

// React Navigation
export { useNavigation } from './useNavigation';
export { useFocusEffect, EffectCallback } from './useFocusEffect';
export type { ResultState } from './fork/getStateFromPath';

export type * from './types';
