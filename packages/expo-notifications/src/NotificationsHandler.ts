import { EventEmitter, Subscription, CodedError, UnavailabilityError } from 'expo-modules-core';

import { Notification, NotificationBehavior } from './Notifications.types';
import NotificationsHandlerModule from './NotificationsHandlerModule';

export class NotificationTimeoutError extends CodedError {
  info: { notification: Notification; id: string };
  constructor(notificationId: string, notification: Notification) {
    super('ERR_NOTIFICATION_TIMEOUT', `Notification handling timed out for ID ${notificationId}.`);
    this.info = { id: notificationId, notification };
  }
}

export type NotificationHandlingError = NotificationTimeoutError | Error;

export interface NotificationHandler {
  handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
  handleSuccess?: (notificationId: string) => void;
  handleError?: (notificationId: string, error: NotificationHandlingError) => void;
}

type HandleNotificationEvent = {
  id: string;
  notification: Notification;
};

type HandleNotificationTimeoutEvent = HandleNotificationEvent;

// Web uses SyntheticEventEmitter
const notificationEmitter = new EventEmitter(NotificationsHandlerModule);

const handleNotificationEventName = 'onHandleNotification';
const handleNotificationTimeoutEventName = 'onHandleNotificationTimeout';

let handleSubscription: Subscription | null = null;
let handleTimeoutSubscription: Subscription | null = null;

export function setNotificationHandler(handler: NotificationHandler | null): void {
  if (handleSubscription) {
    handleSubscription.remove();
    handleSubscription = null;
  }
  if (handleTimeoutSubscription) {
    handleTimeoutSubscription.remove();
    handleTimeoutSubscription = null;
  }

  if (handler) {
    handleSubscription = notificationEmitter.addListener<HandleNotificationEvent>(
      handleNotificationEventName,
      async ({ id, notification }) => {
        if (!NotificationsHandlerModule.handleNotificationAsync) {
          handler.handleError?.(
            id,
            new UnavailabilityError('Notifications', 'handleNotificationAsync')
          );
          return;
        }

        try {
          const behavior = await handler.handleNotification(notification);
          await NotificationsHandlerModule.handleNotificationAsync(id, behavior);
          handler.handleSuccess?.(id);
        } catch (error) {
          handler.handleError?.(id, error);
        }
      }
    );

    handleTimeoutSubscription = notificationEmitter.addListener<HandleNotificationTimeoutEvent>(
      handleNotificationTimeoutEventName,
      ({ id, notification }) =>
        handler.handleError?.(id, new NotificationTimeoutError(id, notification))
    );
  }
}
