import { NativeModules } from 'react-native';

import Notifications from '../Notifications/Notifications';

jest.mock('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter', () => {
  const { EventEmitter } = require('fbemitter');
  return new EventEmitter();
});
jest.useFakeTimers();

const mockScheduledNotification = {
  title: 'Mock notification',
  body: 'hello',
};
it(`properly passes time as millis when scheduling notification on Android`, async () => {
  const spy = jest.fn();
  NativeModules.ExponentNotifications.scheduleLocalNotification = spy;

  const notifDate = new Date();

  await Notifications.scheduleLocalNotificationAsync(
    { title: 'Android notification' },
    {
      time: notifDate,
      repeat: 'minute',
    }
  );

  expect(spy).toHaveBeenCalledTimes(1);

  expect(spy).toHaveBeenCalledWith(
    { data: {}, title: 'Android notification' },
    { repeat: 'minute', time: notifDate.getTime() }
  );
});

it(`properly passes "options.intervalMs" when scheduling notification on android`, async () => {
  const spy = jest.fn();
  NativeModules.ExponentNotifications.scheduleLocalNotification = spy;

  const notifDate = new Date();
  await Notifications.scheduleLocalNotificationAsync(
    { title: 'Android notification' },
    {
      time: notifDate.getTime(),
      intervalMs: 1000,
    }
  );

  expect(spy).toHaveBeenCalledTimes(1);

  expect(spy).toHaveBeenCalledWith(
    { data: {}, title: 'Android notification' },
    { intervalMs: 1000, time: notifDate.getTime() }
  );
});

it(`properly throws if both "options.repeat" and "options.intervalMs" are set in scheduled notification options on android`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      intervalMs: 60000,
      repeat: 'minute',
    });
  } catch (e) {
    expect(e).toMatchSnapshot();
  }

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
});

it(`properly throws for negative number for "options.intervalMs" in scheduled notification options on android`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      intervalMs: -1000,
    });
  } catch (e) {
    expect(e).toMatchSnapshot();
  }

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
});

it(`properly throws for non-integer for "options.intervalMs" in scheduled notification options on android`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      intervalMs: 0.1,
    });
  } catch (e) {
    expect(e).toMatchSnapshot();
  }

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
});
