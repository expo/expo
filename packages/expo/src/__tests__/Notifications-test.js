import warning from 'fbjs/lib/warning';
import { NativeModules } from 'react-native';
import Notifications from '../Notifications';
import { mockPlatformIOS, mockPlatformAndroid } from '../../test/mocking';

const mockNotificationObject = { origin: 'selected', data: {} };
const mockNotificationString = JSON.stringify({ origin: 'received', data: {} });

jest.mock('fbjs/lib/warning');
jest.mock('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter', () => {
  const { EventEmitter } = require('fbemitter');
  return new EventEmitter();
});
jest.useFakeTimers();

describe('Notifications', () => {
  it('emits the initial notification to listeners', () => {
    Notifications._setInitialNotification(mockNotificationObject);

    const callback = jest.fn();
    Notifications.addListener(callback);
    expect(callback).not.toBeCalled();
    jest.runAllTimers();
    expect(callback).toHaveBeenCalledWith(mockNotificationObject);
  });

  it('only emits the initial notification once', () => {
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

  it('converts a string notification to an object for initial notification', () => {
    Notifications._setInitialNotification(mockNotificationString);

    const callback = jest.fn();
    Notifications.addListener(callback);
    jest.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(JSON.parse(mockNotificationString));
  });

  it('emits a notification when Exponent.notification is emitted on DeviceEventEmitter', () => {
    const callback = jest.fn();
    Notifications.addListener(callback);
    expect(callback).not.toBeCalled();
    emitNativeNotification(mockNotificationObject);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(mockNotificationObject);
  });

  it('converts the Exponent.notification from a string to an object if necessary', () => {
    const callback = jest.fn();
    Notifications.addListener(callback);
    emitNativeNotification(mockNotificationString);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(JSON.parse(mockNotificationString));
  });

  it('converts the data key from string to an object if necessary', () => {
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

  it('stops receiving events when removed', () => {
    const callback = jest.fn();
    let subscription = Notifications.addListener(callback);
    emitNativeNotification(mockNotificationObject);
    expect(callback).toHaveBeenCalledTimes(1);
    subscription.remove();
    emitNativeNotification(mockNotificationString);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  const mockedScheduledNotifIOS = {
    title: 'Mock notification',
    body: 'hello',
  };

  it('properly schedules notification without options', async () => {
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

    await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS);

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
  });

  it('properly schedules notification when options are correct (time passed as date obj)', async () => {
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

    await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
      time: new Date(),
      repeat: 'minute',
    });

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
  });

  it('properly schedules notification when options are correct (time passed as number)', async () => {
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

    await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
      time: new Date().getTime() + 1000,
      repeat: 'minute',
    });

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
  });

  it('properly passes time as mumber when scheduling notification on ios', async () => {
    mockPlatformIOS();
    const spy = jest.fn();
    NativeModules.ExponentNotifications.scheduleLocalNotification = spy;

    const notifDate = new Date();
    await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
      // we pass time as date obj, but below it should be passed as number
      time: notifDate,
      repeat: 'minute',
    });

    expect(spy).toHaveBeenCalledTimes(1);

    expect(spy).toHaveBeenCalledWith(
      { data: {}, ...mockedScheduledNotifIOS },
      { repeat: 'minute', time: notifDate.getTime() }
    );
  });

  it('properly passes time as Date when scheduling notification on Android', async () => {
    mockPlatformAndroid();
    const spy = jest.fn();
    NativeModules.ExponentNotifications.scheduleLocalNotification = spy;

    const notifDate = new Date();
    await Notifications.scheduleLocalNotificationAsync(
      { title: 'Android notification' },
      {
        // we pass time as number, but below it should be passed as date
        time: notifDate.getTime(),
        repeat: 'minute',
      }
    );

    expect(spy).toHaveBeenCalledTimes(1);

    expect(spy).toHaveBeenCalledWith(
      { data: {}, title: 'Android notification' },
      { repeat: 'minute', time: notifDate }
    );
  });

  it('properly passes "options.intervalMs" when scheduling notification on android', async () => {
    mockPlatformAndroid();
    const spy = jest.fn();
    NativeModules.ExponentNotifications.scheduleLocalNotification = spy;

    const notifDate = new Date();
    await Notifications.scheduleLocalNotificationAsync(
      { title: 'Android notification' },
      {
        // we pass time as number, but below it should be passed as date
        time: notifDate.getTime(),
        intervalMs: 1000,
      }
    );

    expect(spy).toHaveBeenCalledTimes(1);

    expect(spy).toHaveBeenCalledWith(
      { data: {}, title: 'Android notification' },
      { intervalMs: 1000, time: notifDate }
    );
  });

  it('properly detects invalid time value in scheduled notification options', async () => {
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

    try {
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        time: 'INVALID',
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
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        time: {},
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

  it('properly warns when time value prior to now is used in scheduled notification options', async () => {
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();

    await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
      time: new Date().getTime() / 1000, // accidently pass seconds instead of milliseconds
    });

    expect(warning).toBeCalledWith(
      false,
      `Provided value for "time" is before the current date. Did you possibly \
pass number of seconds since Unix Epoch instead of number of milliseconds?`
    );

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(1);
  });

  it('properly throws for invalid use of "options.repeat" in scheduled notification options', async () => {
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
    try {
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        repeat: 'foobar',
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
  });

  it('properly throws if "options.intervalMs" is used on iOS', async () => {
    mockPlatformIOS();
    const spy = jest.fn();
    NativeModules.ExponentNotifications.scheduleLocalNotification = spy;
    try {
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        intervalMs: 60000,
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
  });

  it('properly throws if both "options.repeat" and "options.intervalMs" are set in scheduled notification options on android', async () => {
    mockPlatformAndroid();
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
    try {
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        intervalMs: 60000,
        repeat: 'minute',
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
  });

  it('properly throws for negative number for "options.intervalMs" in scheduled notification options on android', async () => {
    mockPlatformAndroid();
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
    try {
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        intervalMs: -1000,
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
  });

  it('properly throws for non-integer for "options.intervalMs" in scheduled notification options on android', async () => {
    mockPlatformAndroid();
    NativeModules.ExponentNotifications.scheduleLocalNotification = jest.fn();
    try {
      await Notifications.scheduleLocalNotificationAsync(mockedScheduledNotifIOS, {
        intervalMs: 0.1,
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }

    expect(NativeModules.ExponentNotifications.scheduleLocalNotification).toHaveBeenCalledTimes(0);
  });
});

function emitNativeNotification(notif) {
  require('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter').emit(
    'Exponent.notification',
    notif
  );
}
