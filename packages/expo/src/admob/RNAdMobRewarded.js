// @flow

'use strict';

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { EmitterSubscription, NativeModule } from 'react-native';

const RNAdMobRewarded: NativeModule = NativeModules.RNAdMobRewarded;

const adMobRewardedEventEmitter = new NativeEventEmitter(RNAdMobRewarded);

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

const eventHandlers: { [EventNameType]: Map<Function, EmitterSubscription> } = {};

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
  ...RNAdMobRewarded,
  requestAdAsync: (): Promise<void> => RNAdMobRewarded.requestAd(),
  showAdAsync: (): Promise<void> => RNAdMobRewarded.showAd(),
  dismissAdAsync: (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        RNAdMobRewarded.dismissAd()
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Dismissing ads programmatically is supported only on iOS.'));
      }
    }),
  getIsReadyAsync: (): Promise<boolean> => RNAdMobRewarded.getIsReady(),
  addEventListener,
  removeEventListener,
  removeAllListeners,
};
