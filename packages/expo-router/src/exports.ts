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

export { Link, Redirect, LinkProps, WebAnchorProps } from './link/Link';

export { withLayoutContext } from './layouts/withLayoutContext';
export { Navigator, Slot };

// Expo Router Views
export { ExpoRoot } from './ExpoRoot';
export { Unmatched } from './views/Unmatched';
export { ErrorBoundaryProps } from './views/Try';
export { ErrorBoundary } from './views/ErrorBoundary';
export { ScreenProps } from './useScreens';

// Platform
/**
 * @hidden
 */
export { SplashScreen } from './views/Splash';

// React Navigation
export { useNavigation } from './useNavigation';
export { useFocusEffect, EffectCallback } from './useFocusEffect';
export { ResultState } from './fork/getStateFromPath';

export type * from './types';
