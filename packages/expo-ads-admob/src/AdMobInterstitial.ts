import { NativeModulesProxy, EventEmitter } from 'expo-core';
import { Platform, EmitterSubscription } from 'react-native';

const AdMobInterstitialManager: any = NativeModulesProxy.ExpoAdsAdMobInterstitialManager;

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

const eventHandlers: { [eventName: string]: Map<Function, EmitterSubscription> } = {};

eventNames.forEach(eventName => {
  eventHandlers[eventName] = new Map();
});

const addEventListener = (type: EventNameType, handler: Function) => {
  if (eventNames.includes(type)) {
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

export default {
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
