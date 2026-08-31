import { useLayoutEffect } from 'react';

import { router } from './imperative-api';
import { useOptionalNavigation } from './link/useLoadedNavigation';
import type { Href } from './types';

export type PreloadProps = {
  href: Href;
};

/**
 * When rendered on a focused screen, this component will preload the specified route.
 */
export function Prefetch(props: PreloadProps) {
  const navigation = useOptionalNavigation();

  // TODO(@ubax): This layout effect runs before the router bridge binds on the first commit. It works only because useOptionalNavigation returns null on the first pass. Move to useRouterActions().
  useLayoutEffect(() => {
    if (navigation?.isFocused()) {
      router.prefetch(props.href);
    }
  }, [navigation, props.href]);

  return null;
}
