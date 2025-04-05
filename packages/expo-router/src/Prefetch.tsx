import { useLayoutEffect } from 'react';

import { router } from './imperative-api';
import { useOptionalNavigation } from './link/useLoadedNavigation';
import { Href } from './types';

export type PreloadProps = {
  href: Href;
};

/**
 * When rendered on a focused screen, this component will preload the specified route.
 */
export function Prefetch(props: PreloadProps) {
  const navigation = useOptionalNavigation();

  useLayoutEffect(() => {
    if (navigation?.isFocused()) {
      router.prefetch(props.href);
    }
  }, [navigation, props.href]);

  return null;
}
