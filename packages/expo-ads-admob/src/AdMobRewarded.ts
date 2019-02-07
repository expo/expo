import { EventEmitter, Subscription } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';

import AdMobNativeModule from './ExpoAdsAdMobRewardedVideoAdManager';

const moduleName = 'AdMobRewarded';

const eventNames = [
  'rewardedVideoDidRewardUser',
  'rewardedVideoDidLoad',
  'rewardedVideoDidFailToLoad',
  'rewardedVideoDidOpen',
  'rewardedVideoDidStart',
  'rewardedVideoDidClose',
  'rewardedVideoWillLeaveApplication',
];

type EventNameType =
  | 'rewardedVideoDidRewardUser'
  | 'rewardedVideoDidLoad'
  | 'rewardedVideoDidFailToLoad'
  | 'rewardedVideoDidOpen'
  | 'rewardedVideoDidStart'
  | 'rewardedVideoDidClose'
  | 'rewardedVideoWillLeaveApplication';

const eventEmitter = AdMobNativeModule && new EventEmitter(AdMobNativeModule);

type EventListener = (...args: any[]) => void;

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
  async setTestDeviceID(id: string): Promise<void> {
    if (!AdMobNativeModule.setTestDeviceID) {
      throw new UnavailabilityError(moduleName, 'setTestDeviceID');
    }

    await AdMobNativeModule.setTestDeviceID(id);
  },
  async requestAdAsync(): Promise<void> {
    if (!AdMobNativeModule.requestAd) {
      throw new UnavailabilityError(moduleName, 'requestAdAsync');
    }

    await AdMobNativeModule.requestAd();
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
      if (eventEmitter) {
        eventHandlers[type].set(handler, eventEmitter.addListener(type, handler));
      } else {
        console.warn('AdMobNativeModule native module is not available, are you sure all the native dependencies are linked properly?')
      }
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
    if (!eventEmitter) {
      return;
    }

    for (const eventName of eventNames) {
      eventEmitter.removeAllListeners(eventName);
    }
  },
};
