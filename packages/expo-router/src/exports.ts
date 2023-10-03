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

export { router } from './imperative-api';

export { Link, LinkProps, Redirect } from './link/Link';
export { Href, HrefObject, Route, SearchParams } from './link/href';

export { withLayoutContext } from './layouts/withLayoutContext';
export { Navigator, Slot };

// Expo Router Views
export { ExpoRoot } from './ExpoRoot';
export { Unmatched } from './views/Unmatched';
export { ErrorBoundaryProps } from './views/Try';
export { ErrorBoundary } from './views/ErrorBoundary';

// Platform
export { SplashScreen } from './views/Splash';

// React Navigation
export { useNavigation } from './useNavigation';
export { useFocusEffect } from './useFocusEffect';
