'use client';

import { useRouter } from '../hooks/useRouter';
import { useIsPreview } from '../link/preview/PreviewRouteContext';
import {
  StackActions,
  type NavigationAction,
  type NavigationState,
} from '../react-navigation/native';
import type { Href } from '../types';
import { useFocusEffect } from '../useFocusEffect';

type GuardedRouteRedirectProps = {
  href: Href;
  /** Whether the guard sets `redirectTo`. An explicit redirect always replaces the route. */
  isRedirectExplicit: boolean;
  navigation: {
    dispatch(action: NavigationAction): void;
    getState(): NavigationState | undefined;
    /** Only the navigation object of a stack has `pop`. */
    pop?: unknown;
  };
};

/**
 * Leaves a guarded route when it is focused. A stack pops the route and shows the route below it.
 * Replacing the route with the fallback `href` would add a second copy of the route below.
 */
export function GuardedRouteRedirect({
  href,
  isRedirectExplicit,
  navigation,
}: GuardedRouteRedirectProps) {
  const router = useRouter();
  const isPreview = useIsPreview();

  useFocusEffect(() => {
    if (isPreview) {
      return;
    }

    const state = navigation.getState();
    if (!isRedirectExplicit && typeof navigation.pop === 'function' && state && state.index > 0) {
      // `navigation.dispatch` sets `source` to this route, so only the guarded route is popped.
      navigation.dispatch({ ...StackActions.pop(), target: state.key });
      return;
    }

    try {
      router.replace(href);
    } catch (error) {
      console.error(error);
    }
  });

  return null;
}
