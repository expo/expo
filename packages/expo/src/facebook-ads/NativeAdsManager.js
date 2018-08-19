// @flow

import { NativeModules, NativeEventEmitter } from 'react-native';
import { EventEmitter, EmitterSubscription } from 'fbemitter';

const { CTKNativeAdManager, CTKNativeAdEmitter } = NativeModules;

const nativeAdEmitter = new NativeEventEmitter(CTKNativeAdEmitter);

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
    clickable: Array<number>
  ) {
    return await CTKNativeAdManager.registerViewsForInteraction(
      nativeAdViewTag,
      mediaViewTag,
      adIconViewTag,
      clickable
    );
  }

  /**
   * Creates an instance of AdsManager with a given placementId and adsToRequest.
   * Default number of ads to request is `10`.
   *
   * AdsManager will become loading ads immediately
   */
  constructor(placementId: string, adsToRequest: number = 10) {
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
  onAdsLoaded(func: Function): EmitterSubscription {
    if (this.isValid) {
      setTimeout(func);
      return {
        remove: () => {},
      };
    }

    return this.eventEmitter.once(EVENT_DID_BECOME_VALID, func);
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

  toJSON() {
    return this.placementId;
  }
}

export default NativeAdsManager;
