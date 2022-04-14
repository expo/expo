import { EventEmitter, Subscription, UnavailabilityError } from 'expo-modules-core';

import AdMobNativeModule from './ExpoAdsAdMobInterstitialManager';

const moduleName = 'AdMobInterstitial';

const eventNames = [
  'interstitialDidLoad',
  'interstitialDidFailToLoad',
  'interstitialDidOpen',
  'interstitialDidClose',
];

type EventNameType =
  | 'interstitialDidLoad'
  | 'interstitialDidFailToLoad'
  | 'interstitialDidOpen'
  | 'interstitialDidClose';

type EventListener = (...args: any[]) => void;

const eventEmitter = new EventEmitter(AdMobNativeModule);

const eventHandlers: { [eventName: string]: Map<EventListener, Subscription> } = {};

for (const eventName of eventNames) {
  eventHandlers[eventName] = new Map();
}

export default {
  async setAdUnitID(id: string): Promise<void> {
    if (!AdMobNativeModule.setAdUnitID) {
      throw new UnavailabilityError(moduleName, 'setAdUnitID');
    }

    await AdMobNativeModule.setAdUnitID(id);
  },
  async requestAdAsync(
    options: {
      servePersonalizedAds?: boolean;
      additionalRequestParams?: Record<string, string>;
    } = {}
  ): Promise<void> {
    if (!AdMobNativeModule.requestAd) {
      throw new UnavailabilityError(moduleName, 'requestAdAsync');
    }

    const params: Record<string, string> = {
      ...options.additionalRequestParams,
    };
    if (!options.servePersonalizedAds) {
      params.npa = '1';
    }

    await AdMobNativeModule.requestAd(params);
  },
  async showAdAsync(): Promise<void> {
    if (!AdMobNativeModule.showAd) {
      throw new UnavailabilityError(moduleName, 'showAdAsync');
    }

    await AdMobNativeModule.showAd();
  },
  async dismissAdAsync(): Promise<void> {
    if (!AdMobNativeModule.dismissAd) {
      throw new UnavailabilityError(moduleName, 'dismissAdAsync');
    }

    await AdMobNativeModule.dismissAd();
  },
  async getIsReadyAsync(): Promise<boolean> {
    if (!AdMobNativeModule.getIsReady) {
      throw new UnavailabilityError(moduleName, 'getIsReadyAsync');
    }

    return await AdMobNativeModule.getIsReady();
  },
  addEventListener(type: EventNameType, handler: EventListener) {
    if (eventNames.includes(type)) {
      eventHandlers[type].set(handler, eventEmitter.addListener(type, handler));
    } else {
      console.log(`Event with type ${type} does not exist.`);
    }
  },
  removeEventListener(type: EventNameType, handler: EventListener) {
    const eventSubscription = eventHandlers[type].get(handler);
    if (!eventHandlers[type].has(handler) || !eventSubscription) {
      return;
    }
    eventSubscription.remove();
    eventHandlers[type].delete(handler);
  },
  removeAllListeners() {
    for (const eventName of eventNames) {
      eventEmitter.removeAllListeners(eventName);
    }
  },
};
