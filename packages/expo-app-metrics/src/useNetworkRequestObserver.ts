import { useEventListener } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useRef } from 'react';

import AppMetrics from './module';
import type {
  NetworkRequestCompletedEvent,
  NetworkRequestFilter,
  NetworkRequestObserver,
  NetworkRequestStartedEvent,
} from './types';

/**
 * Order-stable serialization of a filter, used as the effect's dependency key. Listing the fields
 * explicitly keeps `{ hosts, methods }` and `{ methods, hosts }` (the same filter) from producing
 * different keys and re-applying the filter for nothing.
 */
function filterKeyOf(filter: NetworkRequestFilter | null | undefined): string {
  return JSON.stringify({
    hosts: filter?.hosts ?? null,
    methods: filter?.methods ?? null,
  });
}

export type UseNetworkRequestObserverOptions = {
  /**
   * Restricts which requests fire events. Applied natively so non-matching requests never cross
   * into JS. Omit to observe every request. Updating it re-applies the filter on the existing
   * observer without dropping subscriptions.
   */
  filter?: NetworkRequestFilter | null;

  /**
   * Called when a request begins. Fired before any response or timing data exists; correlate
   * with the matching `onCompleted` call via the shared `id`.
   */
  onStarted?: (event: NetworkRequestStartedEvent) => void;

  /**
   * Called when a request finishes (successfully or otherwise). Payload includes status,
   * timings, byte counts, protocol, error, and the redirect chain.
   */
  onCompleted?: (event: NetworkRequestCompletedEvent) => void;
};

/**
 * Subscribes to the native network-request observer for the lifetime of the component. Each
 * mount allocates a `NetworkRequestObserver` SharedObject; unmount releases it and the native
 * delegate slot is reclaimed.
 */
export function useNetworkRequestObserver(
  options: UseNetworkRequestObserverOptions = {}
): NetworkRequestObserver {
  // Serialized so a fresh object literal with the same contents doesn't re-run the effect every
  // render. The observer is created once with the initial filter; later changes go through
  // `setFilter` so subscriptions survive.
  const filterKey = filterKeyOf(options.filter);
  const observer = useReleasingSharedObject(
    () => new AppMetrics.NetworkRequestObserver(options.filter),
    []
  );

  // The constructor already applied the initial filter, so skip re-applying it on mount; only push
  // later changes through `setFilter`. Seeded with the mount key so the first effect run is a no-op
  // unless the filter changed before it fired.
  const appliedFilterKey = useRef(filterKey);
  useEffect(() => {
    if (appliedFilterKey.current === filterKey) {
      return;
    }
    appliedFilterKey.current = filterKey;
    observer.setFilter(options.filter ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observer, filterKey]);

  useEventListener(observer, 'requestStarted', (event) => options.onStarted?.(event));
  useEventListener(observer, 'requestCompleted', (event) => options.onCompleted?.(event));

  return observer;
}
