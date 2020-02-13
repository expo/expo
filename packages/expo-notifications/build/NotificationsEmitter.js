import { EventEmitter, NativeModulesProxy } from '@unimodules/core';
// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NativeModulesProxy.ExpoNotificationsEmitter);
const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';
export function addNotificationReceivedListener(listener) {
    return emitter.addListener(didReceiveNotificationEventName, listener);
}
export function addNotificationsDroppedListener(listener) {
    return emitter.addListener(didDropNotificationsEventName, listener);
}
export function addNotificationResponseReceivedListener(listener) {
    return emitter.addListener(didReceiveNotificationResponseEventName, listener);
}
export function removeSubscription(subscription) {
    emitter.removeSubscription(subscription);
}
export function removeAllListeners() {
    emitter.removeAllListeners(didReceiveNotificationEventName);
    emitter.removeAllListeners(didDropNotificationsEventName);
    emitter.removeAllListeners(didReceiveNotificationResponseEventName);
}
//# sourceMappingURL=NotificationsEmitter.js.map