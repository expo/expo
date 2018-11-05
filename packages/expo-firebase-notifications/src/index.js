// @flow

import { Platform } from 'expo-core';
import { events, ModuleBase, registerModule, utils } from 'expo-firebase-app';

import AndroidAction from './AndroidAction';
import AndroidChannel from './AndroidChannel';
import AndroidChannelGroup from './AndroidChannelGroup';
import AndroidNotifications from './AndroidNotifications';
import IOSNotifications from './IOSNotifications';
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

import type App from 'expo-firebase-app';
import type { NotificationOpen } from './Notification';
import type { NativeNotification, NativeNotificationOpen, Schedule } from './types';
const { SharedEventEmitter } = events;
const { isFunction, isObject } = utils;

type OnNotification = Notification => any;

type OnNotificationObserver = {
  next: OnNotification,
};

type OnNotificationOpened = NotificationOpen => any;

type OnNotificationOpenedObserver = {
  next: NotificationOpen,
};

const NATIVE_EVENTS = [
  'Expo.Firebase.notifications_notification_displayed',
  'Expo.Firebase.notifications_notification_opened',
  'Expo.Firebase.notifications_notification_received',
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

  _ios: IOSNotifications;

  constructor(app: App) {
    super(app, {
      events: NATIVE_EVENTS,
      hasCustomUrlSupport: false,
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      namespace: NAMESPACE,
    });
    this._android = new AndroidNotifications(this);
    this._ios = new IOSNotifications(this);

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onNotificationDisplayed
      'Expo.Firebase.notifications_notification_displayed',
      (notification: NativeNotification) => {
        SharedEventEmitter.emit('onNotificationDisplayed', new Notification(notification, this));
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onNotificationOpened
      'Expo.Firebase.notifications_notification_opened',
      (notificationOpen: NativeNotificationOpen) => {
        SharedEventEmitter.emit('onNotificationOpened', {
          action: notificationOpen.action,
          notification: new Notification(notificationOpen.notification, this),
          results: notificationOpen.results,
        });
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onNotification
      'Expo.Firebase.notifications_notification_received',
      (notification: NativeNotification) => {
        SharedEventEmitter.emit('onNotification', new Notification(notification, this));
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      this.nativeModule.jsInitialised();
    }
  }

  get android(): AndroidNotifications {
    return this._android;
  }

  get ios(): IOSNotifications {
    return this._ios;
  }

  /**
   * Cancel all notifications
   */
  cancelAllNotifications(): Promise<void> {
    return this.nativeModule.cancelAllNotifications();
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
    return this.nativeModule.cancelNotification(notificationId);
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
      return this.nativeModule.displayNotification(notification.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getBadge(): Promise<number> {
    return this.nativeModule.getBadge();
  }

  getInitialNotification(): Promise<NotificationOpen> {
    return this.nativeModule
      .getInitialNotification()
      .then((notificationOpen: NativeNotificationOpen) => {
        if (notificationOpen) {
          return {
            action: notificationOpen.action,
            notification: new Notification(notificationOpen.notification, this),
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
    return this.nativeModule.getScheduledNotifications();
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

    this.logger.info('Creating onNotification listener');
    SharedEventEmitter.addListener('onNotification', listener);

    return () => {
      this.logger.info('Removing onNotification listener');
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

    this.logger.info('Creating onNotificationDisplayed listener');
    SharedEventEmitter.addListener('onNotificationDisplayed', listener);

    return () => {
      this.logger.info('Removing onNotificationDisplayed listener');
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

    this.logger.info('Creating onNotificationOpened listener');
    SharedEventEmitter.addListener('onNotificationOpened', listener);

    return () => {
      this.logger.info('Removing onNotificationOpened listener');
      SharedEventEmitter.removeListener('onNotificationOpened', listener);
    };
  }

  /**
   * Remove all delivered notifications.
   */
  removeAllDeliveredNotifications(): Promise<void> {
    return this.nativeModule.removeAllDeliveredNotifications();
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
    return this.nativeModule.removeDeliveredNotification(notificationId);
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
      return this.nativeModule.scheduleNotification(nativeNotification);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  setBadge(badge: number): Promise<void> {
    return this.nativeModule.setBadge(badge);
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
};
