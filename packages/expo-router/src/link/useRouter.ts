import { useCallback } from 'react';

import { useExpoRouterContext } from '../hooks';
import { Href, resolveHref } from './href';
import { useLinkToPath } from './useLinkToPath';
import { useLoadedNavigation } from './useLoadedNavigation';

// Wraps useLinkTo to provide an API which is similar to the Link component.
export function useLink() {
  console.warn('`useLink()` is deprecated in favor of `useRouter()`');
  return useRouter();
}

type Router = {
  /** Navigate to the provided href. */
  push: (href: Href) => void;
  /** Navigate to route without appending to the history. */
  replace: (href: Href) => void;
  /** Go back in the history. */
  back: () => void;
  /** Update the current route query params. */
  setParams: (params?: Record<string, string>) => void;
};

export function useRouter(): Router {
  const { navigationRef } = useExpoRouterContext();
  const pending = useLoadedNavigation();
  const linkTo = useLinkToPath();

  const push = useCallback(
    (url: Href) => pending(() => linkTo(resolveHref(url))),
    [pending, linkTo]
  );

  const replace = useCallback(
    (url: Href) => pending(() => linkTo(resolveHref(url), 'REPLACE')),
    [pending, linkTo]
  );

  const back = useCallback(() => pending((navigation) => navigation.goBack()), [pending]);

  return {
    push,
    back,
    replace,
    setParams: (params = {}) => {
      // TODO: Type this correctly
      (navigationRef?.current?.setParams as any)(params);
    },
    // TODO(EvanBacon): add `reload`
    // TODO(EvanBacon): add `canGoBack` but maybe more like a `hasContext`
  };
}
