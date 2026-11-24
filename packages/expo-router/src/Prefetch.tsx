import { useLayoutEffect } from 'react';

import { router } from './imperative-api';
import { useOptionalNavigation } from './link/useLoadedNavigation';
import type { Href } from './types';

export type PrefetchProps = {
  href: Href;
};

/**
 * When rendered on a focused screen, this component will prefetch the specified route.
 */
export function Prefetch(props: PrefetchProps) {
  const navigation = useOptionalNavigation();

  // TODO(@ubax): This layout effect runs before the router bridge binds on the first commit. It works only because useOptionalNavigation returns null on the first pass. Move to useRouterActions().
  useLayoutEffect(() => {
    if (navigation?.isFocused()) {
      router.prefetch(props.href);
    }
  }, [navigation, props.href]);

  return null;
}
