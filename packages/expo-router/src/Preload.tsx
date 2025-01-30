import { useEffect } from 'react';

import { router } from './imperative-api';
import { useOptionalNavigation } from './link/useLoadedNavigation';
import { Href } from './types';

export type PreloadProps = {
  href: Href;
};

/**
 * When rendered on a focused screen, this component will preload the specified route.
 */
export function Preload(props: PreloadProps) {
  const navigation = useOptionalNavigation();

  useEffect(() => {
    if (navigation?.isFocused()) {
      router.preload(props.href);
    }
  }, [navigation, props.href]);

  return null;
}
