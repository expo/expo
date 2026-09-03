import {
  type SchedulableNotificationTriggerInput,
  SchedulableTriggerInputTypes,
} from '../Notifications.types';
import { parseTrigger } from '../scheduleNotificationAsync';

type WallClockTriggerInput = Exclude<
  SchedulableNotificationTriggerInput,
  {
    type: SchedulableTriggerInputTypes.CALENDAR | SchedulableTriggerInputTypes.TIME_INTERVAL;
  }
>;

const WALL_CLOCK_TRIGGERS: [string, WallClockTriggerInput][] = [
  ['date', { type: SchedulableTriggerInputTypes.DATE, date: 1_728_000_000_000 }],
  ['daily', { type: SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 15 }],
  [
    'weekly',
    {
      type: SchedulableTriggerInputTypes.WEEKLY,
      weekday: 4,
      hour: 9,
      minute: 15,
    },
  ],
  [
    'monthly',
    {
      type: SchedulableTriggerInputTypes.MONTHLY,
      day: 15,
      hour: 9,
      minute: 15,
    },
  ],
  [
    'yearly',
    {
      type: SchedulableTriggerInputTypes.YEARLY,
      day: 15,
      month: 4,
      hour: 9,
      minute: 15,
    },
  ],
];

describe(parseTrigger, () => {
  it.each(WALL_CLOCK_TRIGGERS)('forwards alarmClock for a %s trigger', (kind, trigger) => {
    expect(parseTrigger({ ...trigger, alarmClock: true })).toMatchObject({
      type: kind,
      alarmClock: true,
    });
  });

  it.each(WALL_CLOCK_TRIGGERS)(
    'omits alarmClock for a %s trigger when it is not set',
    (_kind, trigger) => {
      expect(parseTrigger(trigger)).not.toHaveProperty('alarmClock');
    }
  );

  it('does not add alarmClock to a timeInterval trigger', () => {
    const result = parseTrigger({
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      repeats: false,
    });
    expect(result).not.toHaveProperty('alarmClock');
  });
});
