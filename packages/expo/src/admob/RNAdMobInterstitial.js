// @flow

'use strict';

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { EmitterSubscription, NativeModule } from 'react-native';

const RNAdMobInterstitial: NativeModule = NativeModules.RNAdMobInterstitial;

const adMobInterstitialEmitter = new NativeEventEmitter(RNAdMobInterstitial);

const eventNames = [
  'interstitialDidLoad',
  'interstitialDidFailToLoad',
  'interstitialDidOpen',
  'interstitialDidClose',
  'interstitialWillLeaveApplication',
];

type EventNameType =
  | 'interstitialDidLoad'
  | 'interstitialDidFailToLoad'
  | 'interstitialDidOpen'
  | 'interstitialDidClose'
  | 'interstitialWillLeaveApplication';

const eventHandlers: { [EventNameType]: Map<Function, EmitterSubscription> } = {};

eventNames.forEach(eventName => {
  eventHandlers[eventName] = new Map();
});

const addEventListener = (type: EventNameType, handler: Function) => {
  if (eventNames.includes((type: EventNameType))) {
    eventHandlers[type].set(handler, adMobInterstitialEmitter.addListener(type, handler));
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
  eventNames.forEach(eventName => adMobInterstitialEmitter.removeAllListeners(eventName));

module.exports = {
  ...RNAdMobInterstitial,
  requestAdAsync: (): Promise<void> => RNAdMobInterstitial.requestAd(),
  showAdAsync: (): Promise<void> => RNAdMobInterstitial.showAd(),
  dismissAdAsync: (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        RNAdMobInterstitial.dismissAd()
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Dismissing ads programmatically is supported only on iOS.'));
      }
    }),
  getIsReadyAsync: (): Promise<boolean> => RNAdMobInterstitial.getIsReady(),
  addEventListener,
  removeEventListener,
  removeAllListeners,
};
