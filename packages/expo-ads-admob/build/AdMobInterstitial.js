import { NativeModulesProxy, EventEmitter, Platform } from 'expo-core';
const AdMobInterstitialManager = NativeModulesProxy.ExpoAdsAdMobInterstitialManager;
const adMobInterstitialEmitter = new EventEmitter(AdMobInterstitialManager);
const eventNames = [
    'interstitialDidLoad',
    'interstitialDidFailToLoad',
    'interstitialDidOpen',
    'interstitialDidClose',
    'interstitialWillLeaveApplication',
];
const eventHandlers = {};
eventNames.forEach(eventName => {
    eventHandlers[eventName] = new Map();
});
const addEventListener = (type, handler) => {
    if (eventNames.includes(type)) {
        eventHandlers[type].set(handler, adMobInterstitialEmitter.addListener(type, handler));
    }
    else {
        console.log(`Event with type ${type} does not exist.`);
    }
};
const removeEventListener = (type, handler) => {
    const eventSubscription = eventHandlers[type].get(handler);
    if (!eventHandlers[type].has(handler) || !eventSubscription) {
        return;
    }
    eventSubscription.remove();
    eventHandlers[type].delete(handler);
};
const removeAllListeners = () => eventNames.forEach(eventName => adMobInterstitialEmitter.removeAllListeners(eventName));
export default {
    setAdUnitID: (id) => AdMobInterstitialManager.setAdUnitID(id),
    setTestDeviceID: (id) => AdMobInterstitialManager.setTestDeviceID(id),
    requestAdAsync: () => AdMobInterstitialManager.requestAd(),
    showAdAsync: () => AdMobInterstitialManager.showAd(),
    dismissAdAsync: () => new Promise((resolve, reject) => {
        if (Platform.OS === 'ios') {
            AdMobInterstitialManager.dismissAd()
                .then(resolve)
                .catch(reject);
        }
        else {
            reject(new Error('Dismissing ads programmatically is supported only on iOS.'));
        }
    }),
    getIsReadyAsync: () => AdMobInterstitialManager.getIsReady(),
    addEventListener,
    removeEventListener,
    removeAllListeners,
};
//# sourceMappingURL=AdMobInterstitial.js.map