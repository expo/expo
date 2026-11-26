'use client';

import { useRouter } from '../hooks/useRouter';
import { normalizeRouteName } from '../layouts/GuardContext';
import type { NavigationState } from '../react-navigation/native';
import type { Href } from '../types';
import { useFocusEffect } from '../useFocusEffect';
import { useIsPreview } from './preview/PreviewRouteContext';

type GuardRedirectProps = {
  href: Href;
  /** Whether the guarded route was already guarded when it was added to the stack. */
  guardedOnMount: boolean;
  routeKey: string | undefined;
  /** The path of the guarded route, for example `/nested/private`. */
  routePath: string;
  getState: () => NavigationState | undefined;
};

/**
 * Redirects away from a guarded route. A route pushed while already guarded pops back to the
 * redirect target when it is the route below, instead of adding a second copy of it.
 */
export function GuardRedirect({
  href,
  guardedOnMount,
  routeKey,
  routePath,
  getState,
}: GuardRedirectProps) {
  const router = useRouter();
  const isPreview = useIsPreview();
  useFocusEffect(() => {
    if (isPreview) {
      return;
    }
    try {
      if (guardedOnMount && isPreviousRoute(getState(), routeKey, routePath, href)) {
        router.dismissTo(href);
      } else {
        router.replace(href);
      }
    } catch (error) {
      console.error(error);
    }
  });
  return null;
}

function isPreviousRoute(
  state: NavigationState | undefined,
  routeKey: string | undefined,
  routePath: string,
  href: Href
) {
  const index = state?.routes.findIndex((route) => route.key === routeKey) ?? -1;
  const previousName = state?.routes[index - 1]?.name;
  if (previousName === undefined) {
    return false;
  }
  const directory = routePath.slice(0, routePath.lastIndexOf('/'));
  const previousPath = normalizeRouteName(`${directory}/${previousName}`) || '/';
  return previousPath === (typeof href === 'string' ? href : href.pathname);
}
