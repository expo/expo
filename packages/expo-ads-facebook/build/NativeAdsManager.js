import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from 'expo-core';
import { EventEmitter } from 'fbemitter';
import { UnavailabilityError } from 'expo-errors';
let { CTKNativeAdManager } = NativeModulesProxy;
const nativeAdEmitter = CTKNativeAdManager && new NativeEventEmitter(CTKNativeAdManager);
CTKNativeAdManager = CTKNativeAdManager || {};
const EVENT_DID_BECOME_VALID = 'AdsManagerDidBecomeValid';
class NativeAdsManager {
    /**
     * Creates an instance of AdsManager with a given placementId and adsToRequest.
     * Default number of ads to request is `10`.
     *
     * AdsManager will become loading ads immediately
     */
    constructor(placementId, adsToRequest = 10) {
        /** {@boolean} indicating whether AdsManager is ready to serve ads **/
        this.isValid = false;
        /** {@EventEmitter} used for sending out updates **/
        this.eventEmitter = new EventEmitter();
        if (!CTKNativeAdManager.init) {
            throw new UnavailabilityError('CTKNativeAdManager', 'init');
        }
        this.placementId = placementId;
        this.adsToRequest = adsToRequest;
        this._listenForStateChanges();
        CTKNativeAdManager.init(placementId, adsToRequest);
    }
    static async registerViewsForInteractionAsync(nativeAdViewTag, mediaViewTag, adIconViewTag, clickable) {
        return await CTKNativeAdManager.registerViewsForInteraction(nativeAdViewTag, mediaViewTag, adIconViewTag, clickable);
    }
    static triggerEvent(nativeAdViewTag) {
        return CTKNativeAdManager.triggerEvent(nativeAdViewTag);
    }
    /**
     * Listens for AdManager state changes and updates internal state. When it changes,
     * callers will be notified of a change
     */
    _listenForStateChanges() {
        if (!nativeAdEmitter) {
            console.warn('CTKNativeAdManager native module is not available, are you sure all the native dependencies are linked properly?');
            return;
        }
        nativeAdEmitter.addListener('CTKNativeAdsManagersChanged', managers => {
            const isValidNew = managers[this.placementId];
            const isValid = this.isValid;
            if (isValid !== isValidNew && isValidNew) {
                this.isValid = true;
                this.eventEmitter.emit(EVENT_DID_BECOME_VALID);
            }
        });
    }
    /**
     * Used to listening for state changes
     *
     * If manager already became valid, it will call the function w/o registering
     * handler for events
     */
    onAdsLoaded(listener) {
        if (this.isValid) {
            setImmediate(listener);
            return {
                remove: () => { },
            };
        }
        return this.eventEmitter.once(EVENT_DID_BECOME_VALID, listener);
    }
    /**
     * Disables auto refreshing for this native ad manager
     */
    disableAutoRefresh() {
        CTKNativeAdManager.disableAutoRefresh(this.placementId);
    }
    /**
     * Set the native ads manager caching policy. This controls which media from
     * the native ads are cached before the onAdsLoaded is called.
     * The default is to not block on caching.
     */
    setMediaCachePolicy(cachePolicy) {
        CTKNativeAdManager.setMediaCachePolicy(this.placementId, cachePolicy);
    }
}
export default NativeAdsManager;
//# sourceMappingURL=NativeAdsManager.js.map