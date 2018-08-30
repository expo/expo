// @flow

'use strict';

import { NativeModulesProxy, EventEmitter } from 'expo-core';
import { Platform } from 'react-native';

const AdMobRewardedVideoAdManager: Object = NativeModulesProxy.ExpoAdsAdMobRewardedVideoAdManager;

const adMobRewardedEventEmitter = new EventEmitter(AdMobRewardedVideoAdManager);

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

type Subscription = {
  remove: () => void,
};

const eventHandlers: { [EventNameType]: Map<Function, Subscription> } = {};

eventNames.forEach(eventName => {
  eventHandlers[eventName] = new Map();
});

const addEventListener = (type: EventNameType, handler: Function) => {
  if (eventNames.includes((type: EventNameType))) {
    eventHandlers[type].set(handler, adMobRewardedEventEmitter.addListener(type, handler));
  } else {
    console.log(`Event with type ${type} does not exist.`);
  }
};

const removeEventListener = (type: EventNameType, handler: Function) => {
  const eventSubscription = eventHandlers[type].get(handler);
  if (!eventHandlers[type].has(handler) || !eventSubscription) {
    return;
  }
  eventSubscription.remove();
  eventHandlers[type].delete(handler);
};

const removeAllListeners = () =>
  eventNames.forEach(eventName => adMobRewardedEventEmitter.removeAllListeners(eventName));

module.exports = {
  setAdUnitID: (id: string): Promise<void> => AdMobRewardedVideoAdManager.setAdUnitID(id),
  setTestDeviceID: (id: string): Promise<void> => AdMobRewardedVideoAdManager.setTestDeviceID(id),
  requestAdAsync: (): Promise<void> => AdMobRewardedVideoAdManager.requestAd(),
  showAdAsync: (): Promise<void> => AdMobRewardedVideoAdManager.showAd(),
  dismissAdAsync: (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        AdMobRewardedVideoAdManager.dismissAd()
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Dismissing ads programmatically is supported only on iOS.'));
      }
    }),
  getIsReadyAsync: (): Promise<boolean> => AdMobRewardedVideoAdManager.getIsReady(),
  addEventListener,
  removeEventListener,
  removeAllListeners,
};
