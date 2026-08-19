import { type EventSubscription, CodedError, Platform, UnavailabilityError } from 'expo';
import { LegacyEventEmitter } from 'expo-modules-core';

import type { Notification, NotificationBehavior } from './Notifications.types';
import NotificationsHandlerModule from './NotificationsHandlerModule';
import { mapNotification } from './utils/mapNotificationResponse';

/**
 * @hidden
 */
export class NotificationTimeoutError extends CodedError {
  info: { notification: Notification; id: string };
  constructor(notificationId: string, notification: Notification) {
    super('ERR_NOTIFICATION_TIMEOUT', `Notification handling timed out for ID ${notificationId}.`);
    this.info = { id: notificationId, notification };
  }
}

// @docsMissing
export type NotificationHandlingError = NotificationTimeoutError | Error;

export interface NotificationHandler {
  /**
   * A function accepting an incoming notification returning a `Promise` resolving to a behavior ([`NotificationBehavior`](#notificationbehavior))
   * applicable to the notification
   * @param notification An object representing the notification.
   */
  handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
  /**
   * A function called whenever an incoming notification is handled successfully.
   * @param notificationId Identifier of the notification.
   */
  handleSuccess?: (notificationId: string) => void;
  /**
   * A function called whenever calling `handleNotification()` for an incoming notification fails.
   * @param notificationId Identifier of the notification.
   * @param error An error which occurred in form of `NotificationHandlingError` object.
   */
  handleError?: (notificationId: string, error: NotificationHandlingError) => void;
}

type HandleNotificationEvent = {
  id: string;
  notification: Notification;
};

type HandleNotificationTimeoutEvent = HandleNotificationEvent;

// Web uses SyntheticEventEmitter
const notificationEmitter = new LegacyEventEmitter(NotificationsHandlerModule);

const handleNotificationEventName = 'onHandleNotification';
const handleNotificationTimeoutEventName = 'onHandleNotificationTimeout';

let handleSubscription: EventSubscription | null = null;
let handleTimeoutSubscription: EventSubscription | null = null;

/**
 * The handler that applies until the app sets one of its own. The native code that handles a handler
 * that doesn't answer in time asks for the same behavior.
 */
const defaultNotificationHandler: NotificationHandler = {
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
};

/**
 * When a notification is received while the app is running, using this function you can set a callback that will decide
 * whether the notification should be shown to the user or not.
 *
 * When a notification is received, `handleNotification` is called with the incoming notification as an argument.
 * The function should respond with a behavior object within 3 seconds, otherwise the notification will be presented.
 * If the notification is handled successfully, `handleSuccess` is called with the identifier of the notification,
 * otherwise (or on timeout) `handleError` will be called.
 *
 * Until the app sets a handler, and when the handler it sets does not respond in time, the
 * notification is shown with a banner, in the notification list, with a sound, and with the badge from the notification.
 *
 * @param handler A single parameter which should be either `null` or a [`NotificationHandler`](#notificationhandler) object.
 * Passing `null` removes the handler, so `expo-notifications` no longer decides whether an incoming notification shows.
 * On Android the notification is then not shown while the app is in the foreground.
 * On iOS the decision goes to the `UNUserNotificationCenterDelegate` that another library may set, and the notification is not shown if there is none.
 *
 * @example Implementing a notification handler that shows the notification without a sound.
 * ```jsx
 * import * as Notifications from 'expo-notifications';
 *
 * Notifications.setNotificationHandler({
 *   handleNotification: async () => ({
 *     shouldShowBanner: true,
 *     shouldShowList: true,
 *     shouldPlaySound: false,
 *     shouldSetBadge: false,
 *   }),
 * });
 * ```
 * @header inForeground
 */
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
    subscribe(handler);
  }
}

function subscribe(activeHandler: NotificationHandler): void {
  handleSubscription = notificationEmitter.addListener<HandleNotificationEvent>(
    handleNotificationEventName,
    async ({ id, notification }) => {
      if (!NotificationsHandlerModule.handleNotificationAsync) {
        activeHandler.handleError?.(
          id,
          new UnavailabilityError('Notifications', 'handleNotificationAsync')
        );
        return;
      }

      try {
        const mappedNotification = mapNotification(notification);
        const behavior = await activeHandler.handleNotification(mappedNotification);

        if (behavior.shouldShowAlert) {
          console.warn(
            '[expo-notifications]: `shouldShowAlert` is deprecated. Specify `shouldShowBanner` and / or `shouldShowList` instead.'
          );
        }
        await NotificationsHandlerModule.handleNotificationAsync(id, behavior);
        activeHandler.handleSuccess?.(id);
      } catch (error: any) {
        // TODO(@kitten): This callback expects specific Error types, but we never narrow the type before calling this callback
        activeHandler.handleError?.(id, error);
      }
    }
  );

  handleTimeoutSubscription = notificationEmitter.addListener<HandleNotificationTimeoutEvent>(
    handleNotificationTimeoutEventName,
    ({ id, notification }) =>
      activeHandler.handleError?.(
        id,
        new NotificationTimeoutError(id, mapNotification(notification))
      )
  );
}

// side-effect: Notifications that arrive while the app is in the foreground show by default. An app that wants
// another behavior replaces this handler with `setNotificationHandler`.
// Web has no foreground notification handling.
if (Platform.OS !== 'web') {
  subscribe(defaultNotificationHandler);
}
