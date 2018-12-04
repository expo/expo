import { NativeModulesProxy, EventEmitter, Platform } from 'expo-core';
const AdMobRewardedVideoAdManager = NativeModulesProxy.ExpoAdsAdMobRewardedVideoAdManager;
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
const eventHandlers = {};
eventNames.forEach(eventName => {
    eventHandlers[eventName] = new Map();
});
const addEventListener = (type, handler) => {
    if (eventNames.includes(type)) {
        eventHandlers[type].set(handler, adMobRewardedEventEmitter.addListener(type, handler));
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
const removeAllListeners = () => eventNames.forEach(eventName => adMobRewardedEventEmitter.removeAllListeners(eventName));
export default {
    setAdUnitID: (id) => AdMobRewardedVideoAdManager.setAdUnitID(id),
    setTestDeviceID: (id) => AdMobRewardedVideoAdManager.setTestDeviceID(id),
    requestAdAsync: () => AdMobRewardedVideoAdManager.requestAd(),
    showAdAsync: () => AdMobRewardedVideoAdManager.showAd(),
    dismissAdAsync: () => new Promise((resolve, reject) => {
        if (Platform.OS === 'ios') {
            AdMobRewardedVideoAdManager.dismissAd()
                .then(resolve)
                .catch(reject);
        }
        else {
            reject(new Error('Dismissing ads programmatically is supported only on iOS.'));
        }
    }),
    getIsReadyAsync: () => AdMobRewardedVideoAdManager.getIsReady(),
    addEventListener,
    removeEventListener,
    removeAllListeners,
};
//# sourceMappingURL=AdMobRewarded.js.map