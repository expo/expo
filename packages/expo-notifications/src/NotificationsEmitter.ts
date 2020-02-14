import { EventEmitter, Subscription, NativeModulesProxy } from '@unimodules/core';
import { Notification, NotificationResponse } from './NotificationsEmitter.types';
export { Notification, NotificationResponse } from './NotificationsEmitter.types';

// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NativeModulesProxy.ExpoNotificationsEmitter);

const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';

export function addNotificationReceivedListener(
  listener: (event: Notification) => void
): Subscription {
  return emitter.addListener<Notification>(didReceiveNotificationEventName, listener);
}

export function addNotificationsDroppedListener(listener: () => void): Subscription {
  return emitter.addListener<void>(didDropNotificationsEventName, listener);
}

export function addNotificationResponseReceivedListener(
  listener: (event: NotificationResponse) => void
): Subscription {
  return emitter.addListener<NotificationResponse>(
    didReceiveNotificationResponseEventName,
    listener
  );
}

export function removeSubscription(subscription: Subscription) {
  emitter.removeSubscription(subscription);
}

export function removeAllListeners() {
  emitter.removeAllListeners(didReceiveNotificationEventName);
  emitter.removeAllListeners(didDropNotificationsEventName);
  emitter.removeAllListeners(didReceiveNotificationResponseEventName);
}
