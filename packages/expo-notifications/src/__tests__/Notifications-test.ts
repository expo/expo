import { fail } from 'assert';

import NotificationScheduler from '../NotificationScheduler';
import { SchedulableTriggerInputTypes, NotificationTriggerInput } from '../Notifications.types';
import scheduleNotificationAsync from '../scheduleNotificationAsync';

const notificationTriggerInputTest = {
  identifier: 'test_id',
  content: {
    title: 'test',
  },
};

it(`verifies date (as Date) trigger handling`, async () => {
  const input = {
    ...notificationTriggerInputTest,
    trigger: new Date(),
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'date',
      timestamp: input.trigger.getTime(),
    }
  );
});

it(`verifies date (as time) trigger handling`, async () => {
  const input = {
    ...notificationTriggerInputTest,
    trigger: new Date().getTime(),
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'date',
      timestamp: input.trigger,
    }
  );
});

it(`verifies daily trigger handling`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.DAILY,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies daily trigger input validation`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.DAILY,
    hour: 12,
    minute: 70,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  try {
    await scheduleNotificationAsync(input);
    fail('Test should have thrown');
  } catch (e) {
    expect(e instanceof RangeError).toBe(true);
    expect(`${e}`).toEqual(
      'RangeError: The minute parameter needs to be between 0 and 59. Found: 70'
    );
  }
});

it(`verifies weekly trigger handling`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.WEEKLY,
    weekday: 1,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies weekly trigger input validation`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.WEEKLY,
    weekday: 8,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  try {
    await scheduleNotificationAsync(input);
    fail('Test should have thrown');
  } catch (e) {
    expect(e instanceof RangeError).toBe(true);
    expect(`${e}`).toEqual(
      'RangeError: The weekday parameter needs to be between 1 and 7. Found: 8'
    );
  }
});

it(`verifies monthly trigger handling`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.MONTHLY,
    day: 5,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies monthly trigger input validation`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.MONTHLY,
    day: 32,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  try {
    await scheduleNotificationAsync(input);
    fail('Test should have thrown');
  } catch (e) {
    expect(e instanceof RangeError).toBe(true);
    expect(`${e}`.indexOf('RangeError')).toEqual(0);
    expect(`${e}`.indexOf('Found: 32')).not.toEqual(-1);
  }
});

it(`verifies yearly trigger handling`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.YEARLY,
    day: 1,
    month: 6,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies yearly trigger input validation`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.YEARLY,
    day: 32,
    month: 6,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  try {
    await scheduleNotificationAsync(input);
    fail('Test should have thrown');
  } catch (e) {
    expect(e instanceof RangeError).toBe(true);
    expect(`${e}`).toEqual(
      'RangeError: The day parameter for month 6 must be between 1 and 31. Found: 32'
    );
  }
});

it(`verifies daily trigger handling with channelId`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.DAILY,
    hour: 12,
    minute: 30,
    channelId: 'test-channel-id',
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies weekly trigger handling with channelId`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.WEEKLY,
    weekday: 1,
    hour: 12,
    minute: 30,
    channelId: 'test-channel-id',
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies yearly trigger handling with channelId`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.YEARLY,
    day: 1,
    month: 6,
    hour: 12,
    minute: 30,
    channelId: 'test-channel-id',
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      ...input.trigger,
    }
  );
});

it(`verifies immediate trigger handling`, async () => {
  const trigger = null;
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    null
  );
});

it(`verifies immediate trigger handling with channelId`, async () => {
  const trigger = {
    channelId: 'test-channel-id',
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    null
  );
});

it(`verifies time interval trigger handling`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 3600,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      channelId: undefined,
      repeats: false,
      type: 'timeInterval',
      seconds: input.trigger.seconds,
    }
  );

  await scheduleNotificationAsync({
    ...input,
    trigger: {
      ...input.trigger,
      repeats: true,
    },
  });
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'timeInterval',
      repeats: true,
      seconds: input.trigger.seconds,
    }
  );
});

it(`verifies calendar trigger handling`, async () => {
  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.CALENDAR,
    hour: 12,
    minute: 30,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'calendar',
      repeats: undefined,
      value: {
        ...input.trigger,
      },
    }
  );

  await scheduleNotificationAsync({
    ...input,
    trigger: {
      ...input.trigger,
      second: 10,
    },
  });
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'calendar',
      repeats: undefined,
      value: {
        ...input.trigger,
        second: 10,
      },
    }
  );

  await scheduleNotificationAsync({
    ...input,
    trigger: {
      ...input.trigger,
      repeats: true,
      second: 10,
    },
  });
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'calendar',
      repeats: true,
      value: {
        ...input.trigger,
        second: 10,
      },
    }
  );
});
