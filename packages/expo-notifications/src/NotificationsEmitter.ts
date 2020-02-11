import { EventEmitter, Subscription, NativeModulesProxy } from '@unimodules/core';
import { Notification, NotificationResponse } from './NotificationsEmitter.types';

interface NotificationReceivedEvent {
  type: 'notificationReceived';
  notification: Notification;
}

interface NotificationResponseEvent {
  type: 'notificationResponseReceived';
  response: NotificationResponse;
}

interface NotificationsDroppedEvent {
  type: 'notificationsDropped';
}

export type NotificationEvent =
  | NotificationReceivedEvent
  | NotificationResponseEvent
  | NotificationsDroppedEvent;

export type NotificationListener = (notification: NotificationEvent) => void;

// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NativeModulesProxy.ExpoNotificationsEmitter);
const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';

type CompoundSubscription = Subscription & {
  __subscriptions: Subscription[];
};

export function addNotificationListener(listener: NotificationListener): Subscription {
  const subscriptions = [
    emitter.addListener<Notification>(didReceiveNotificationEventName, notification => {
      listener({ notification, type: 'notificationReceived' });
    }),
    emitter.addListener<NotificationResponse>(didReceiveNotificationResponseEventName, response => {
      listener({ response, type: 'notificationResponseReceived' });
    }),
    emitter.addListener<void>(didReceiveNotificationResponseEventName, () => {
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
  } as CompoundSubscription;
}

export function removeNotificationSubscription(subscription: Subscription) {
  if ('__subscriptions' in subscription) {
    const compoundSubscription: CompoundSubscription = subscription;
    for (let subscription of compoundSubscription.__subscriptions) {
      emitter.removeSubscription(subscription);
    }
  } else {
    emitter.removeSubscription(subscription);
  }
}

export function removeAllNotificationListeners() {
  emitter.removeAllListeners(didReceiveNotificationEventName);
  emitter.removeAllListeners(didDropNotificationsEventName);
  emitter.removeAllListeners(didReceiveNotificationResponseEventName);
}
