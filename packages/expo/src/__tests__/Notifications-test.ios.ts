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

it(`properly schedules notification when options are correct (time passed as date obj, not repeated)`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
    time: new Date(),
  });

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
});

it(`properly passes time as mumber when scheduling notification`, async () => {
  const spy = jest.fn();
  NativeModules.ExponentNotifications.scheduleLocalNotification = spy;

  const notifDate = new Date();
  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
    // we pass time as date obj, but below it should be passed as number
    time: notifDate,
  });

  expect(spy).toHaveBeenCalledTimes(1);

  expect(spy).toHaveBeenCalledWith(
    { data: {}, ...mockScheduledNotification },
    { time: notifDate.getTime() }
  );
});

it(`properly throws if "options.intervalMs" is used`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      intervalMs: 60000,
    });
  } catch (e) {
    expect(e).toMatchSnapshot();
  }

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
});
