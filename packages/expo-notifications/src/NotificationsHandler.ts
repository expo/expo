import { EventEmitter, Subscription, CodedError, Platform } from '@unimodules/core';

import { Notification } from './NotificationsEmitter.types';
import NotificationsHandlerModule, {
  BaseNotificationBehavior,
  IosNotificationBehavior,
  AndroidNotificationBehavior,
  NativeNotificationBehavior,
} from './NotificationsHandlerModule';

export class NotificationTimeoutError extends CodedError {
  info: { notification: Notification; id: string };
  constructor(notificationId: string, notification: Notification) {
    super('ERR_NOTIFICATION_TIMEOUT', `Notification handling timed out for ID ${notificationId}.`);
    this.info = { id: notificationId, notification };
  }
}

export type NotificationHandlingError = NotificationTimeoutError | Error;

export interface NotificationBehavior extends BaseNotificationBehavior {
  ios?: IosNotificationBehavior;
  android?: AndroidNotificationBehavior;
}

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
        try {
          const { ios, android, ...baseBehavior } = await handler.handleNotification(notification);
          const platformSpecificBehaviors = { ios, android };
          const nativeBehavior: NativeNotificationBehavior = {
            ...baseBehavior,
            ...platformSpecificBehaviors[Platform.OS],
          };
          await NotificationsHandlerModule.handleNotificationAsync(id, nativeBehavior);
          // TODO: Remove eslint-disable once we upgrade to a version that supports ?. notation.
          // eslint-disable-next-line
          handler.handleSuccess?.(id);
        } catch (error) {
          // TODO: Remove eslint-disable once we upgrade to a version that supports ?. notation.
          // eslint-disable-next-line
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
