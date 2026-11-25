// @react-navigation/native is an optional peerDependency. When the host app
// hasn't installed it, `require` throws and the integration becomes a no-op.
import type { ComponentType } from 'react';

import type { NavigationContainerRefLike, NavigationRouteLike, NavigationStateLike } from './types';

interface OptionalReactNavigation {
  NavigationContainer?: ComponentType<Record<string, unknown> & { ref?: unknown }>;
  useNavigation(): Pick<NavigationContainerRefLike, 'isFocused'>;
  useNavigationContainerRef(): NavigationContainerRefLike;
  useRoute(): NavigationRouteLike;
  useStateForPath(): NavigationStateLike | undefined;
}

let optionalReactNavigation: OptionalReactNavigation | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  optionalReactNavigation = require('@react-navigation/native') as OptionalReactNavigation;
} catch {}
const isReactNavigationInstalled = !!optionalReactNavigation;

export { optionalReactNavigation, isReactNavigationInstalled };
