'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import useLatestCallback from '../utils/useLatestCallback';
import { useLoaderTarget } from './useLoaderTarget';

const getServerSnapshot = () => false;

/**
 * Refreshes the calling page's loader without hiding its existing data while pending.
 * Errors are handled by the error boundary around `useLoaderData()` readers.
 *
 * The completion promise never rejects. It resolves when the refresh finishes or its
 * route is released, not when React paints or when the refresh succeeds.
 */
export function useLoaderRevalidator(): {
  revalidate: () => Promise<void>;
  isPending: boolean;
} {
  const { runtime, serverData, owner, path } = useLoaderTarget();
  const subscribe = useCallback(
    (listener: () => void) => runtime.subscribeStatus(path, listener),
    [runtime, path]
  );
  const getSnapshot = useCallback(() => runtime.isRevalidating(path), [runtime, path]);
  const isPending = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useClientLayoutEffect(() => {
    if (!serverData) runtime.updatePath(owner, path);
  }, [runtime, serverData, owner, path]);

  const revalidate = useLatestCallback(() =>
    serverData ? Promise.resolve() : runtime.revalidate(owner, path)
  );
  return { revalidate, isPending: !serverData && isPending };
}
