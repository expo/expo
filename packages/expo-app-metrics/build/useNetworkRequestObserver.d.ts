import type { NetworkRequestCompletedEvent, NetworkRequestObserver, NetworkRequestStartedEvent } from './types';
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
export declare function useNetworkRequestObserver(options?: UseNetworkRequestObserverOptions): NetworkRequestObserver;
//# sourceMappingURL=useNetworkRequestObserver.d.ts.map