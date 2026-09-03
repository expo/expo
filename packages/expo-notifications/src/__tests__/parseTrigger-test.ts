import { SchedulableTriggerInputTypes } from '../Notifications.types';
import { parseTrigger } from '../scheduleNotificationAsync';

type AnyTrigger = Record<string, any>;

const BASE_TRIGGERS: Record<string, AnyTrigger> = {
  date: { type: SchedulableTriggerInputTypes.DATE, date: 1_728_000_000_000 },
  daily: { type: SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 15 },
  weekly: { type: SchedulableTriggerInputTypes.WEEKLY, weekday: 4, hour: 9, minute: 15 },
  monthly: { type: SchedulableTriggerInputTypes.MONTHLY, day: 15, hour: 9, minute: 15 },
  yearly: { type: SchedulableTriggerInputTypes.YEARLY, day: 15, month: 4, hour: 9, minute: 15 },
};

describe(parseTrigger, () => {
  it.each(['date', 'daily', 'weekly', 'monthly', 'yearly'])(
    'forwards alarmClock for a %s trigger',
    (kind) => {
      expect(parseTrigger({ ...BASE_TRIGGERS[kind], alarmClock: true })).toMatchObject({
        type: kind,
        alarmClock: true,
      });
    }
  );

  it.each(['date', 'daily', 'weekly', 'monthly', 'yearly'])(
    'omits alarmClock for a %s trigger when it is not set',
    (kind) => {
      expect(parseTrigger(BASE_TRIGGERS[kind])).not.toHaveProperty('alarmClock');
    }
  );

  it('preserves the date timestamp', () => {
    expect(parseTrigger({ ...BASE_TRIGGERS.date, alarmClock: true })).toMatchObject({
      type: 'date',
      timestamp: 1_728_000_000_000,
    });
  });

  it('does not add alarmClock to a timeInterval trigger', () => {
    const result = parseTrigger({
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      repeats: false,
    });
    expect(result).not.toHaveProperty('alarmClock');
  });
});
