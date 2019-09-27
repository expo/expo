import { NativeModules, Platform } from 'react-native';

import Notifications from '../Notifications/Notifications';

const mockNotificationObject = { origin: 'selected', data: {} } as any;
const mockNotificationString = JSON.stringify({ origin: 'received', data: {} });

jest.mock('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter', () => {
  const { EventEmitter } = require('fbemitter');
  return new EventEmitter();
});
jest.useFakeTimers();

it(`emits the initial notification to listeners`, () => {
  Notifications._setInitialNotification(mockNotificationObject);

  const callback = jest.fn();
  Notifications.addListener(callback);
  expect(callback).not.toBeCalled();
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledWith(mockNotificationObject);
});

it(`only emits the initial notification once`, () => {
  Notifications._setInitialNotification(mockNotificationObject);

  const callback = jest.fn();
  Notifications.addListener(callback);
  expect(callback).not.toBeCalled();
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(1);

  const secondCallback = jest.fn();
  Notifications.addListener(secondCallback);
  jest.runAllTimers();
  expect(secondCallback).not.toBeCalled();
});

it(`converts a string notification to an object for initial notification`, () => {
  Notifications._setInitialNotification(mockNotificationString as any);

  const callback = jest.fn();
  Notifications.addListener(callback);
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(JSON.parse(mockNotificationString));
});

it(`emits a notification when Exponent.notification is emitted on DeviceEventEmitter`, () => {
  const callback = jest.fn();
  Notifications.addListener(callback);
  expect(callback).not.toBeCalled();
  emitNativeNotification(mockNotificationObject);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(mockNotificationObject);
});

it(`converts the Exponent.notification from a string to an object if necessary`, () => {
  const callback = jest.fn();
  Notifications.addListener(callback);
  emitNativeNotification(mockNotificationString);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(JSON.parse(mockNotificationString));
});

it(`converts the data key from string to an object if necessary`, () => {
  const callback = jest.fn();
  Notifications.addListener(callback);

  const data = JSON.stringify({ a: 'b' });
  const mockNotificationObjectWithDataString = { origin: 'selected', data };
  emitNativeNotification(mockNotificationObjectWithDataString);

  let expectedResult = {
    ...mockNotificationObjectWithDataString,
    data: JSON.parse(data),
  };
  expect(callback).toHaveBeenCalledWith(expectedResult);
});

it(`stops receiving events when removed`, () => {
  const callback = jest.fn();
  let subscription = Notifications.addListener(callback);
  emitNativeNotification(mockNotificationObject);
  expect(callback).toHaveBeenCalledTimes(1);
  subscription.remove();
  emitNativeNotification(mockNotificationString);
  expect(callback).toHaveBeenCalledTimes(1);
});

const mockScheduledNotification = {
  title: 'Mock notification',
  body: 'hello',
};

it(`properly schedules notification without options`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification);

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
});

it(`properly schedules notification when options are correct (time passed as date obj, repeated)`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
    time: new Date(),
    repeat: 'minute',
  });

  expect(
    Platform.select({
      ios: NativeModules.ExponentNotifications.legacyScheduleLocalRepeatingNotification,
      android: NativeModules.ExponentNotifications.scheduleLocalNotification,
    })
  ).toHaveBeenCalledTimes(1);
});

it(`properly schedules notification when options are correct (time passed as number, repeated)`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
    time: new Date().getTime() + 1000,
    repeat: 'minute',
  });

  expect(
    Platform.select({
      ios: NativeModules.ExponentNotifications.legacyScheduleLocalRepeatingNotification,
      android: NativeModules.ExponentNotifications.scheduleLocalNotification,
    })
  ).toHaveBeenCalledTimes(1);
});

it(`properly schedules notification when options are correct (time passed as number, not repeated)`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
    time: new Date().getTime() + 1000,
  });

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
});

it(`properly detects invalid time value in scheduled notification options`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      time: 'INVALID' as any,
    });
  } catch (e) {
    expect(e).toEqual(
      new Error(
        `Provided value for "time" is invalid. Please verify that it's either \
a number representing Unix Epoch time in milliseconds, or a valid date object.`
      )
    );
  }

  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      time: {} as any,
    });
  } catch (e) {
    expect(e).toEqual(
      new Error(
        `Provided value for "time" is invalid. Please verify that it's either \
a number representing Unix Epoch time in milliseconds, or a valid date object.`
      )
    );
  }

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
});

it(`properly warns when time value prior to now is used in scheduled notification options`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => null);

  await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
    time: new Date().getTime() / 1000, // accidently pass seconds instead of milliseconds
  });

  expect(consoleWarnSpy).toBeCalledWith(
    `Provided value for "time" is before the current date. Did you possibly \
pass number of seconds since Unix Epoch instead of number of milliseconds?`
  );

  consoleWarnSpy.mockRestore();

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
});

it(`properly throws for invalid use of "options.repeat" in scheduled notification options`, async () => {
  NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
  try {
    await Notifications.scheduleLocalNotificationAsync(mockScheduledNotification, {
      repeat: 'foobar' as any,
    });
  } catch (e) {
    expect(e).toMatchSnapshot();
  }

  expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
});

function emitNativeNotification(notif) {
  require('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter').emit(
    'Exponent.notification',
    notif
  );
}
