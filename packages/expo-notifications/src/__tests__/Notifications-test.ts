import NotificationScheduler from '../NotificationScheduler';
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
  const trigger = {
    hour: 12,
    minute: 30,
    repeats: true as boolean | undefined,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  delete trigger.repeats;
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'daily',
      ...input.trigger,
    }
  );
});

it(`verifies weekly trigger handling`, async () => {
  const trigger = {
    weekday: 1,
    hour: 12,
    minute: 30,
    repeats: true as boolean | undefined,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  delete trigger.repeats;
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'weekly',
      ...input.trigger,
    }
  );
});

it(`verifies yearly trigger handling`, async () => {
  const trigger = {
    day: 1,
    month: 6,
    hour: 12,
    minute: 30,
    repeats: true as boolean | undefined,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  delete trigger.repeats;
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'yearly',
      ...input.trigger,
    }
  );
});

it(`verifies daily trigger handling with channelId`, async () => {
  const trigger = {
    hour: 12,
    minute: 30,
    channelId: 'test-channel-id',
    repeats: true as boolean | undefined,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  delete trigger.repeats;
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'daily',
      ...input.trigger,
    }
  );
});

it(`verifies weekly trigger handling with channelId`, async () => {
  const trigger = {
    weekday: 1,
    hour: 12,
    minute: 30,
    channelId: 'test-channel-id',
    repeats: true as boolean | undefined,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  delete trigger.repeats;
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'weekly',
      ...input.trigger,
    }
  );
});

it(`verifies yearly trigger handling with channelId`, async () => {
  const trigger = {
    day: 1,
    month: 6,
    hour: 12,
    minute: 30,
    channelId: 'test-channel-id',
    repeats: true as boolean | undefined,
  };
  const input = {
    ...notificationTriggerInputTest,
    trigger,
  };
  await scheduleNotificationAsync(input);
  delete trigger.repeats;
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'yearly',
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
  const input = {
    ...notificationTriggerInputTest,
    trigger: {
      seconds: 3600,
    },
  };
  await scheduleNotificationAsync(input);
  expect(NotificationScheduler.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    input.identifier,
    input.content,
    {
      type: 'timeInterval',
      repeats: false,
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
  const input = {
    ...notificationTriggerInputTest,
    trigger: {
      hour: 12,
      minute: 30,
    },
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
