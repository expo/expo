/**
 * @flow
 * Notifications representation wrapper
 */
import {
  events,
  utils,
  getLogger,
  ModuleBase,
  getNativeModule,
  registerModule,
} from 'expo-firebase-app';
import type App from 'expo-firebase-app';
const { SharedEventEmitter } = events;
import { Platform } from 'expo-core';
const { isFunction, isObject } = utils;

import AndroidAction from './AndroidAction';
import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
import AndroidNotifications from './AndroidNotifications';
import AndroidRemoteInput from './AndroidRemoteInput';
import Notification from './Notification';
import {
  BadgeIconType,
  Category,
  Defaults,
  GroupAlert,
  Importance,
  Priority,
  SemanticAction,
  Visibility,
} from './types';

import type { NotificationOpen } from './Notification';
import type { NativeNotification, NativeNotificationOpen, Schedule } from './types';

type OnNotification = Notification => any;

type OnNotificationObserver = {
  next: OnNotification,
};

type OnNotificationOpened = NotificationOpen => any;

type OnNotificationOpenedObserver = {
  next: NotificationOpen,
};

const NATIVE_EVENTS = [
  'notifications_notification_displayed',
  'notifications_notification_opened',
  'notifications_notification_received',
];

export const MODULE_NAME = 'ExpoFirebaseNotifications';
export const NAMESPACE = 'notifications';

export const statics = {
  Android: {
    Action: AndroidAction,
    BadgeIconType,
    Category,
    Channel: AndroidChannel,
    ChannelGroup: AndroidChannelGroup,
    Defaults,
    GroupAlert,
    Importance,
    Priority,
    RemoteInput: AndroidRemoteInput,
    SemanticAction,
    Visibility,
  },
  Notification,
};

// iOS 8/9 scheduling
// fireDate: Date;
// timeZone: TimeZone;
// repeatInterval: NSCalendar.Unit;
// repeatCalendar: Calendar;
// region: CLRegion;
// regionTriggersOnce: boolean;

// iOS 10 scheduling
// TODO

// Android scheduling
// TODO

/**
 * @class Notifications
 */
export default class Notifications extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  _android: AndroidNotifications;

  constructor(app: App) {
    super(app, {
      events: NATIVE_EVENTS,
      hasShards: false,
      moduleName: MODULE_NAME,
      multiApp: false,
      namespace: NAMESPACE,
    });
    this._android = new AndroidNotifications(this);

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onNotificationDisplayed
      'notifications_notification_displayed',
      (notification: NativeNotification) => {
        SharedEventEmitter.emit('onNotificationDisplayed', new Notification(notification));
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onNotificationOpened
      'notifications_notification_opened',
      (notificationOpen: NativeNotificationOpen) => {
        SharedEventEmitter.emit('onNotificationOpened', {
          action: notificationOpen.action,
          notification: new Notification(notificationOpen.notification),
          results: notificationOpen.results,
        });
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onNotification
      'notifications_notification_received',
      (notification: NativeNotification) => {
        SharedEventEmitter.emit('onNotification', new Notification(notification));
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      getNativeModule(this).jsInitialised();
    }
  }

  get android(): AndroidNotifications {
    return this._android;
  }

  /**
   * Cancel all notifications
   */
  cancelAllNotifications(): Promise<void> {
    return getNativeModule(this).cancelAllNotifications();
  }

  /**
   * Cancel a notification by id.
   * @param notificationId
   */
  cancelNotification(notificationId: string): Promise<void> {
    if (!notificationId) {
      return Promise.reject(
        new Error('Notifications: cancelNotification expects a `notificationId`')
      );
    }
    return getNativeModule(this).cancelNotification(notificationId);
  }

  /**
   * Display a notification
   * @param notification
   * @returns {*}
   */
  displayNotification(notification: Notification): Promise<void> {
    if (!(notification instanceof Notification)) {
      return Promise.reject(
        new Error(
          `Notifications:displayNotification expects a 'Notification' but got type ${typeof notification}`
        )
      );
    }
    try {
      return getNativeModule(this).displayNotification(notification.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getBadge(): Promise<number> {
    return getNativeModule(this).getBadge();
  }

  getInitialNotification(): Promise<NotificationOpen> {
    return getNativeModule(this)
      .getInitialNotification()
      .then((notificationOpen: NativeNotificationOpen) => {
        if (notificationOpen) {
          return {
            action: notificationOpen.action,
            notification: new Notification(notificationOpen.notification),
            results: notificationOpen.results,
          };
        }
        return null;
      });
  }

  /**
   * Returns an array of all scheduled notifications
   * @returns {Promise.<Array>}
   */
  getScheduledNotifications(): Promise<Notification[]> {
    return getNativeModule(this).getScheduledNotifications();
  }

  onNotification(nextOrObserver: OnNotification | OnNotificationObserver): () => any {
    let listener;
    if (isFunction(nextOrObserver)) {
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error(
        'Notifications.onNotification failed: First argument must be a function or observer object with a `next` function.'
      );
    }

    getLogger(this).info('Creating onNotification listener');
    SharedEventEmitter.addListener('onNotification', listener);

    return () => {
      getLogger(this).info('Removing onNotification listener');
      SharedEventEmitter.removeListener('onNotification', listener);
    };
  }

  onNotificationDisplayed(nextOrObserver: OnNotification | OnNotificationObserver): () => any {
    let listener;
    if (isFunction(nextOrObserver)) {
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error(
        'Notifications.onNotificationDisplayed failed: First argument must be a function or observer object with a `next` function.'
      );
    }

    getLogger(this).info('Creating onNotificationDisplayed listener');
    SharedEventEmitter.addListener('onNotificationDisplayed', listener);

    return () => {
      getLogger(this).info('Removing onNotificationDisplayed listener');
      SharedEventEmitter.removeListener('onNotificationDisplayed', listener);
    };
  }

  onNotificationOpened(
    nextOrObserver: OnNotificationOpened | OnNotificationOpenedObserver
  ): () => any {
    let listener;
    if (isFunction(nextOrObserver)) {
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error(
        'Notifications.onNotificationOpened failed: First argument must be a function or observer object with a `next` function.'
      );
    }

    getLogger(this).info('Creating onNotificationOpened listener');
    SharedEventEmitter.addListener('onNotificationOpened', listener);

    return () => {
      getLogger(this).info('Removing onNotificationOpened listener');
      SharedEventEmitter.removeListener('onNotificationOpened', listener);
    };
  }

  /**
   * Remove all delivered notifications.
   */
  removeAllDeliveredNotifications(): Promise<void> {
    return getNativeModule(this).removeAllDeliveredNotifications();
  }

  /**
   * Remove a delivered notification.
   * @param notificationId
   */
  removeDeliveredNotification(notificationId: string): Promise<void> {
    if (!notificationId) {
      return Promise.reject(
        new Error('Notifications: removeDeliveredNotification expects a `notificationId`')
      );
    }
    return getNativeModule(this).removeDeliveredNotification(notificationId);
  }

  /**
   * Schedule a notification
   * @param notification
   * @returns {*}
   */
  scheduleNotification(notification: Notification, schedule: Schedule): Promise<void> {
    if (!(notification instanceof Notification)) {
      return Promise.reject(
        new Error(
          `Notifications:scheduleNotification expects a 'Notification' but got type ${typeof notification}`
        )
      );
    }
    try {
      const nativeNotification = notification.build();
      nativeNotification.schedule = schedule;
      return getNativeModule(this).scheduleNotification(nativeNotification);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  setBadge(badge: number): Promise<void> {
    return getNativeModule(this).setBadge(badge);
  }
}

registerModule(Notifications);

export {
  AndroidAction,
  AndroidChannel,
  AndroidChannelGroup,
  AndroidNotifications,
  AndroidRemoteInput,
  Notification,
  OnNotification,
  OnNotificationObserver,
  OnNotificationOpened,
  OnNotificationOpenedObserver,
  NotificationOpen,
  NativeNotification,
  NativeNotificationOpen,
  Schedule,
};
