// @flow

'use strict';

import { NativeModulesProxy, EventEmitter } from 'expo-core';
import { Platform } from 'react-native';
import type { EmitterSubscription } from 'react-native';

const AdMobInterstitialManager: Object = NativeModulesProxy.ExpoAdsAdMobInterstitialManager;

const adMobInterstitialEmitter = new EventEmitter(AdMobInterstitialManager);

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
  setAdUnitID: (id: string): Promise<void> => AdMobInterstitialManager.setAdUnitID(id),
  setTestDeviceID: (id: string): Promise<void> => AdMobInterstitialManager.setTestDeviceID(id),
  requestAdAsync: (): Promise<void> => AdMobInterstitialManager.requestAd(),
  showAdAsync: (): Promise<void> => AdMobInterstitialManager.showAd(),
  dismissAdAsync: (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        AdMobInterstitialManager.dismissAd()
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Dismissing ads programmatically is supported only on iOS.'));
      }
    }),
  getIsReadyAsync: (): Promise<boolean> => AdMobInterstitialManager.getIsReady(),
  addEventListener,
  removeEventListener,
  removeAllListeners,
};
