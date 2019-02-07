import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from 'expo-core';
import { EventEmitter, EventSubscription } from 'fbemitter';
import { UnavailabilityError } from 'expo-errors';

let { CTKNativeAdManager } = NativeModulesProxy;

const nativeAdEmitter = CTKNativeAdManager && new NativeEventEmitter(CTKNativeAdManager);

CTKNativeAdManager = CTKNativeAdManager || {};

const EVENT_DID_BECOME_VALID = 'AdsManagerDidBecomeValid';

type AdManagerCachePolicy = 'none' | 'icon' | 'image' | 'all';

class NativeAdsManager {
  /** {@string} with placement id of ads **/
  placementId: string;

  /** {@number} of ads to request at once **/
  adsToRequest: number;

  /** {@boolean} indicating whether AdsManager is ready to serve ads **/
  isValid: boolean = false;

  /** {@EventEmitter} used for sending out updates **/
  eventEmitter: EventEmitter = new EventEmitter();

  static async registerViewsForInteractionAsync(
    nativeAdViewTag: number,
    mediaViewTag: number,
    adIconViewTag: number,
    clickable: number[]
  ) {
    return await CTKNativeAdManager.registerViewsForInteraction(
      nativeAdViewTag,
      mediaViewTag,
      adIconViewTag,
      clickable
    );
  }

  static triggerEvent(nativeAdViewTag: number) {
    return CTKNativeAdManager.triggerEvent(nativeAdViewTag);
  }

  /**
   * Creates an instance of AdsManager with a given placementId and adsToRequest.
   * Default number of ads to request is `10`.
   *
   * AdsManager will become loading ads immediately
   */
  constructor(placementId: string, adsToRequest: number = 10) {
    if (!CTKNativeAdManager.init) {
      throw new UnavailabilityError('CTKNativeAdManager', 'init');
    }
    this.placementId = placementId;
    this.adsToRequest = adsToRequest;

    this._listenForStateChanges();

    CTKNativeAdManager.init(placementId, adsToRequest);
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
  onAdsLoaded(listener: () => void): EventSubscription {
    if (this.isValid) {
      setImmediate(listener);
      return {
        remove: () => {},
      } as EventSubscription;
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
  setMediaCachePolicy(cachePolicy: AdManagerCachePolicy) {
    CTKNativeAdManager.setMediaCachePolicy(this.placementId, cachePolicy);
  }
}

export default NativeAdsManager;
