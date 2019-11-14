import Constants from 'expo-constants';
import { EventEmitter, EventSubscription } from 'fbemitter';
import invariant from 'invariant';
import { AsyncStorage, Platform } from 'react-native';
import { CodedError, RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import ExpoNotifications from './ExpoNotifications';
import { Mailbox } from './Mailbox';
import {
  Notification,
  LocalNotification,
  Channel,
  ActionType,
  UserInteraction,
  OnUserInteractionListener,
  OnForegroundNotificationListener,
  OnTokenChangeListener,
} from './Notifications.types';

const _mailbox: Mailbox = new Mailbox();

let isItFirstListener: boolean = true;

function _processNotification(notification) {
  notification = Object.assign({}, notification);

  if (!notification.data) {
    notification.data = {};
  }

  if (notification.hasOwnProperty('count')) {
    delete notification.count;
  }

  // Delete any Android properties on iOS and merge the iOS properties on root notification object
  if (Platform.OS === 'ios') {
    if (notification.android) {
      delete notification.android;
    }

    if (notification.ios) {
      notification = Object.assign(notification, notification.ios);
      notification.data._displayInForeground = notification.ios._displayInForeground;
      delete notification.ios;
    }
  }

  // Delete any iOS properties on Android and merge the Android properties on root notification
  // object
  if (Platform.OS === 'android') {
    if (notification.ios) {
      delete notification.ios;
    }

    if (notification.android) {
      notification = Object.assign(notification, notification.android);
      delete notification.android;
    }
  }

  return notification;
}

function _validateNotification(notification) {
  if (Platform.OS === 'ios') {
    invariant(
      !!notification.title && !!notification.body,
      'Local notifications on iOS require both a title and a body'
    );
  } else if (Platform.OS === 'android') {
    invariant(!!notification.title, 'Local notifications on Android require a title');
  }
}

// User passes set of actions titles.
export async function createCategoryAsync(categoryId: string, actions: ActionType[]): Promise<void> {
  return ExpoNotifications.createCategoryAsync(categoryId, actions);
}

export async function deleteCategoryAsync(categoryId: string): Promise<void> {
  return ExpoNotifications.deleteCategoryAsync(categoryId);
}

export async function createChannelAsync(id: string, channel: Channel): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn(`createChannelAndroidAsync(...) has no effect on ${Platform.OS}`);
    return Promise.resolve();
  }
  return ExpoNotifications.createChannel(id, channel);
}

export async function deleteChannelAsync(id: string): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn(`deleteChannelAndroidAsync(...) has no effect on ${Platform.OS}`);
    return Promise.resolve();
  }
  return ExpoNotifications.deleteChannel(id);
}

export async function createChannelGroupAsync(groupId: string, groupName: string): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn(`createChannelGroupAsync(...) has no effect on ${Platform.OS}`);
    return;
  }
  return ExpoNotifications.createChannelGroup(groupId, groupName);
}

export async function deleteChannelGroupAsync(groupId: string): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn(`deleteChannelGroupAsync(...) has no effect on ${Platform.OS}`);
    return;
  }
  return ExpoNotifications.deleteChannelGroup(groupId);
}

/**
 * @remarks
 * Shows a notification instantly
 */

export async function presentLocalNotificationAsync(
  notification: LocalNotification
): Promise<string> {
  _validateNotification(notification);
  let nativeNotification = _processNotification(notification);
  return await ExpoNotifications.presentLocalNotification(nativeNotification);
}

/**
 * @remarks
 * Dismiss currently shown notification with ID (Android only)
 */
export async function dismissNotificationAsync(notificationId: string): Promise<void> {
  if (!ExpoNotifications.dismissNotification) {
    throw new UnavailabilityError('Expo.Notifications', 'dismissNotification');
  }
  return await ExpoNotifications.dismissNotification(notificationId);
}
/**
 * @remarks
 * Dismiss all currently shown notifications (Android only)
 */
export async function dismissAllNotificationsAsync(): Promise<void> {
  if (!ExpoNotifications.dismissAllNotifications) {
    throw new UnavailabilityError('Expo.Notifications', 'dismissAllNotifications');
  }
  return await ExpoNotifications.dismissAllNotifications();
}
/**
 * @remarks
 * Cancel scheduled notification notification with ID
 */
export async function cancelScheduledNotificationAsync(
  notificationId: string
): Promise<void> {
  return ExpoNotifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * @remarks
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotificationsAsync(): Promise<void> {
  return ExpoNotifications.cancelAllScheduledNotificationsAsync();
}

export async function setBadgeNumberAsync(number: number): Promise<void> {
  if (!ExpoNotifications.setBadgeNumberAsync) {
    throw new UnavailabilityError('Expo.Notifications', 'setBadgeNumberAsync');
  }
  return ExpoNotifications.setBadgeNumberAsync(number);
}

export async function setOnTokenChangeListener(listener: OnTokenChangeListener) {
  _mailbox.setOnTokenChangeListener(listener);
  await ExpoNotifications.registerForPushNotificationsAsync();
}

export function addOnUserInteractionListener(
  listenerName: string,
  listener: OnUserInteractionListener
) {
  _mailbox.addOnUserInteractionListener(listenerName, listener);
  if (isItFirstListener) {
    isItFirstListener = true;
    setTimeout( async () => {
        ExpoNotifications.flushPendingUserInteractionsAsync();
    }, 0);
  }
}

export function addOnForegroundNotificationListener(
  listenerName: string,
  listener: OnForegroundNotificationListener
) {
  _mailbox.addOnForegroundNotificationListener(listenerName, listener);
}

export function removeOnUserInteractionListener(listenerName: string) {
  _mailbox.removeOnUserInteractionListener(listenerName);
}

export function removeOnForegroundNotificationListener(listenerName: string) {
  _mailbox.removeOnForegroundNotificationListener(listenerName);
}

export async function scheduleNotificationWithCalendarAsync(
  notification: LocalNotification,
  options: {
    year?: number;
    month?: number;
    hour?: number;
    day?: number;
    minute?: number;
    second?: number;
    weekDay?: number;
    repeat?: boolean;
  } = {}
): Promise<string> {
  const areOptionsValid: boolean =
    (options.month == null || isInRangeInclusive(options.month, 1, 12)) &&
    (options.day == null || isInRangeInclusive(options.day, 1, 31)) &&
    (options.hour == null || isInRangeInclusive(options.hour, 0, 23)) &&
    (options.minute == null || isInRangeInclusive(options.minute, 0, 59)) &&
    (options.second == null || isInRangeInclusive(options.second, 0, 59)) &&
    (options.weekDay == null || isInRangeInclusive(options.weekDay, 1, 7)) &&
    (options.weekDay == null || options.day == null);

  if (!areOptionsValid) {
    throw new CodedError(
      'WRONG_OPTIONS',
      'Options in scheduleNotificationWithCalendarAsync call were incorrect!'
    );
  }

  _validateNotification(notification);
  let nativeNotification = _processNotification(notification);
  return ExpoNotifications.scheduleNotificationWithCalendar(nativeNotification, options);
}

export async function scheduleNotificationWithTimerAsync(
  notification: LocalNotification,
  options: {
    interval: number;
    repeat?: boolean;
  }
): Promise<string> {
  if (options.interval < 1) {
    throw new CodedError('WRONG_OPTIONS', 'Interval must be not less then 1');
  }
  _validateNotification(notification);
  let nativeNotification = _processNotification(notification);
  return ExpoNotifications.scheduleNotificationWithTimer(nativeNotification, options);
}

function isInRangeInclusive(variable: number, min: number, max: number): boolean {
  return variable >= min && variable <= max;
}

/*
 * Legacy code
 */

let _emitter;

function _maybeInitEmitter() {
  if (!_emitter) {
    _emitter = new EventEmitter();
    addOnUserInteractionListener('legacyListener', (userInteraction: UserInteraction) => {
      let legacyMsg: Notification = {
        data: userInteraction,
        origin: 'selected',
        remote: userInteraction.remote == true,
        isMultiple: false,
      };

      _emitter.emit('notification', legacyMsg);
    });
    addOnForegroundNotificationListener('legacyListener', (notification: LocalNotification) => {
      let legacyMsg: Notification = {
        data: notification,
        origin: 'received',
        remote: notification.remote == true,
        isMultiple: false,
      };

      _emitter.emit('notification', legacyMsg);
    });
  }
}

export function addListener(listener: (notification: Notification) => unknown): EventSubscription {
  _maybeInitEmitter();
  return _emitter.addListener('notification', listener);
}
