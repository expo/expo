import { EventEmitter, NativeModulesProxy } from '@unimodules/core';
// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NativeModulesProxy.ExpoNotificationsEmitter);
const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';
export function addNotificationListener(listener) {
    const subscriptions = [
        emitter.addListener(didReceiveNotificationEventName, notification => {
            listener({ notification, type: 'notificationReceived' });
        }),
        emitter.addListener(didReceiveNotificationResponseEventName, response => {
            listener({ response, type: 'notificationResponseReceived' });
        }),
        emitter.addListener(didReceiveNotificationResponseEventName, () => {
            listener({ type: 'notificationsDropped' });
        }),
    ];
    return {
        remove: () => {
            for (let subscription of subscriptions) {
                subscription.remove();
            }
        },
        __subscriptions: subscriptions,
    };
}
export function removeNotificationSubscription(subscription) {
    if ('__subscriptions' in subscription) {
        const compoundSubscription = subscription;
        for (let subscription of compoundSubscription.__subscriptions) {
            emitter.removeSubscription(subscription);
        }
    }
    else {
        emitter.removeSubscription(subscription);
    }
}
export function removeAllNotificationListeners() {
    emitter.removeAllListeners(didReceiveNotificationEventName);
    emitter.removeAllListeners(didDropNotificationsEventName);
    emitter.removeAllListeners(didReceiveNotificationResponseEventName);
}
//# sourceMappingURL=NotificationsEmitter.js.map