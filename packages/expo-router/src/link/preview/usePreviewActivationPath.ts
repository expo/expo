import { useCallback, useEffect, useEffectEvent, useId, useState, useRef } from 'react';

import { useRouter } from '../../hooks';
import { unstable_navigationEvents, type RoutePreloadedEvent } from '../../navigationEvents';
import type { Href } from '../../types';
import type { PreviewActivationRoute } from './native';
import { findPreviewActivationPath } from './utils';

export function usePreviewActivationPath(): [
  PreviewActivationRoute[] | undefined,
  (href: Href) => void,
  () => void,
] {
  const router = useRouter();
  const linkId = useId();
  const attempt = useRef(0);
  const previewId = useRef<string | undefined>(undefined);
  const [pendingActivationPath, setPendingActivationPath] = useState<
    { id: string; path: PreviewActivationRoute[] } | undefined
  >();
  const [activationPath, setActivationPath] = useState<PreviewActivationRoute[] | undefined>();

  const onRoutePreloaded = useEffectEvent(
    ({ routeKey, state }: Omit<RoutePreloadedEvent, 'type'>) => {
      const id = previewId.current;
      if (id === undefined) return;
      const nextActivationPath = findPreviewActivationPath(state, routeKey, id);
      if (nextActivationPath) {
        setPendingActivationPath({ id, path: nextActivationPath });
      }
    }
  );

  useEffect(() => unstable_navigationEvents.addListener('routePreloaded', onRoutePreloaded), []);

  useEffect(() => {
    if (!pendingActivationPath) {
      return;
    }
    // Native needs the preloaded screen to mount before it can resolve the path.
    const timeout = setTimeout(() => {
      if (previewId.current === pendingActivationPath.id) {
        setActivationPath(pendingActivationPath.path);
      }
    });
    return () => clearTimeout(timeout);
  }, [pendingActivationPath]);

  const cancel = useCallback(() => {
    previewId.current = undefined;
    setPendingActivationPath(undefined);
    setActivationPath(undefined);
  }, []);

  const prefetch = useCallback(
    (href: Href) => {
      setPendingActivationPath(undefined);
      setActivationPath(undefined);
      const id = `${linkId}:${++attempt.current}`;
      previewId.current = id;
      router.prefetch(href, { __internal__previewId: id });
    },
    [linkId, router.prefetch]
  );

  return [activationPath, prefetch, cancel];
}
