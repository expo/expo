import { useEventListener } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';

import AppMetrics from './module';
import type {
  NetworkRequestCompletedEvent,
  NetworkRequestObserver,
  NetworkRequestStartedEvent,
} from './types';

export type UseNetworkRequestObserverOptions = {
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
  const observer = useReleasingSharedObject(() => new AppMetrics.NetworkRequestObserver(), []);

  useEventListener(observer, 'requestStarted', (event) => options.onStarted?.(event));
  useEventListener(observer, 'requestCompleted', (event) => options.onCompleted?.(event));

  return observer;
}
