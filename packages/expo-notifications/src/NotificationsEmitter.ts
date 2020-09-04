import { EventEmitter, Subscription } from '@unimodules/core';

import { Notification, NotificationResponse } from './Notifications.types';
import NotificationsEmitterModule from './NotificationsEmitterModule';

// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NotificationsEmitterModule);

const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';

export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';

export function addNotificationReceivedListener<T>(
  listener: (event: Notification<T>) => void
): Subscription {
  return emitter.addListener<Notification<T>>(didReceiveNotificationEventName, listener);
}

export function addNotificationsDroppedListener(listener: () => void): Subscription {
  return emitter.addListener<void>(didDropNotificationsEventName, listener);
}

export function addNotificationResponseReceivedListener<T>(
  listener: (event: NotificationResponse<T>) => void
): Subscription {
  return emitter.addListener<NotificationResponse<T>>(
    didReceiveNotificationResponseEventName,
    listener
  );
}

export function removeNotificationSubscription(subscription: Subscription) {
  emitter.removeSubscription(subscription);
}

export function removeAllNotificationListeners() {
  emitter.removeAllListeners(didReceiveNotificationEventName);
  emitter.removeAllListeners(didDropNotificationsEventName);
  emitter.removeAllListeners(didReceiveNotificationResponseEventName);
}
