import { EventEmitter, EventSubscription } from 'fbemitter';
declare type AdManagerCachePolicy = 'none' | 'icon' | 'image' | 'all';
declare class NativeAdsManager {
    /** {@string} with placement id of ads **/
    placementId: string;
    /** {@number} of ads to request at once **/
    adsToRequest: number;
    /** {@boolean} indicating whether AdsManager is ready to serve ads **/
    isValid: boolean;
    /** {@EventEmitter} used for sending out updates **/
    eventEmitter: EventEmitter;
    static registerViewsForInteractionAsync(nativeAdViewTag: number, mediaViewTag: number, adIconViewTag: number, clickable: number[]): Promise<any>;
    static triggerEvent(nativeAdViewTag: number): any;
    /**
     * Creates an instance of AdsManager with a given placementId and adsToRequest.
     * Default number of ads to request is `10`.
     *
     * AdsManager will become loading ads immediately
     */
    constructor(placementId: string, adsToRequest?: number);
    /**
     * Listens for AdManager state changes and updates internal state. When it changes,
     * callers will be notified of a change
     */
    _listenForStateChanges(): void;
    /**
     * Used to listening for state changes
     *
     * If manager already became valid, it will call the function w/o registering
     * handler for events
     */
    onAdsLoaded(listener: () => void): EventSubscription;
    /**
     * Disables auto refreshing for this native ad manager
     */
    disableAutoRefresh(): void;
    /**
     * Set the native ads manager caching policy. This controls which media from
     * the native ads are cached before the onAdsLoaded is called.
     * The default is to not block on caching.
     */
    setMediaCachePolicy(cachePolicy: AdManagerCachePolicy): void;
}
export default NativeAdsManager;
