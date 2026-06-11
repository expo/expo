import { useEventListener } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect } from 'react';

import AppMetrics from './module';
import type {
  NetworkRequestCompletedEvent,
  NetworkRequestFilter,
  NetworkRequestObserver,
  NetworkRequestStartedEvent,
} from './types';

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
  const filterKey = JSON.stringify(options.filter ?? null);
  const observer = useReleasingSharedObject(
    () => new AppMetrics.NetworkRequestObserver(options.filter),
    []
  );

  useEffect(() => {
    observer.setFilter(options.filter ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observer, filterKey]);

  useEventListener(observer, 'requestStarted', (event) => options.onStarted?.(event));
  useEventListener(observer, 'requestCompleted', (event) => options.onCompleted?.(event));

  return observer;
}
