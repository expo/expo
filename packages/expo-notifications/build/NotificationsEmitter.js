import { EventEmitter } from '@unimodules/core';
import NotificationsEmitterModule from './NotificationsEmitterModule';
// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NotificationsEmitterModule);
const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';
export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';
export function addNotificationReceivedListener(listener) {
    return emitter.addListener(didReceiveNotificationEventName, listener);
}
export function addNotificationsDroppedListener(listener) {
    return emitter.addListener(didDropNotificationsEventName, listener);
}
export function addNotificationResponseReceivedListener(listener) {
    return emitter.addListener(didReceiveNotificationResponseEventName, listener);
}
export function removeNotificationSubscription(subscription) {
    emitter.removeSubscription(subscription);
}
export function removeAllNotificationListeners() {
    emitter.removeAllListeners(didReceiveNotificationEventName);
    emitter.removeAllListeners(didDropNotificationsEventName);
    emitter.removeAllListeners(didReceiveNotificationResponseEventName);
}
//# sourceMappingURL=NotificationsEmitter.js.map