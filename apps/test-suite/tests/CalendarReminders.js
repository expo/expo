import * as Calendar from 'expo-calendar';
import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';

export const name = 'CalendarReminders';

async function createTestReminderAsync(calendarId) {
  return await Calendar.createReminderAsync(calendarId, {
    title: 'Reminder to buy a ticket',
    startDate: new Date(2019, 3, 3, 9, 0, 0),
    dueDate: new Date(2019, 3, 3, 23, 59, 59),
  });
}

function expectMethodsToReject(t, methods) {
  for (const methodName of methods) {
    t.describe(`${methodName}()`, () => {
      t.it('rejects with UnavailabilityError on unsupported platform', async () => {
        let error;
        try {
          await Calendar[methodName]();
        } catch (e) {
          error = e;
        }
        t.expect(error instanceof UnavailabilityError).toBe(true);
        t.expect(error.message).toBe(new UnavailabilityError('Calendar', methodName).message);
      });
    });
  }
}

function testReminderShape(t, reminder) {
  t.expect(reminder).toBeDefined();
  t.expect(typeof reminder.id).toBe('string');
  t.expect(typeof reminder.calendarId).toBe('string');
  t.expect(typeof reminder.title).toBe('string');
  // t.expect(typeof reminder.startDate).toBe('string');
  // t.expect(typeof reminder.dueDate).toBe('string');
  t.expect(typeof reminder.completed).toBe('boolean');
}

export async function test(t) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('CalendarReminders', () => {
    if (Platform.OS !== 'ios') {
      expectMethodsToReject(t, [
        'requestRemindersPermissionsAsync',
        'getRemindersAsync',
        'getReminderAsync',
        'createReminderAsync',
        'updateReminderAsync',
        'deleteReminderAsync',
      ]);
      return;
    }

    let calendarId = null;

    t.beforeAll(async () => {
      calendarId = await Calendar.createCalendarAsync({
        title: 'Expo Reminders Calendar',
        entityType: Calendar.EntityTypes.REMINDER,
      });
    });

    t.describe('requestRemindersPermissionsAsync()', () => {
      t.it('requests for Reminders permissions', async () => {
        const results = await Calendar.requestRemindersPermissionsAsync();

        t.expect(results.granted).toBe(true);
        t.expect(results.status).toBe('granted');
      });
    });

    t.describe('createReminderAsync()', () => {
      let reminderId;

      t.it('creates a reminder', async () => {
        reminderId = await createTestReminderAsync(calendarId);

        t.expect(reminderId).toBeDefined();
        t.expect(typeof reminderId).toBe('string');
      });

      t.afterAll(async () => {
        await Calendar.deleteReminderAsync(reminderId);
      });
    });

    t.describe('getRemindersAsync()', () => {
      let reminderId;

      t.beforeAll(async () => {
        reminderId = await createTestReminderAsync(calendarId);
      });

      t.it('returns an array of reminders', async () => {
        const reminders = await Calendar.getRemindersAsync(
          [calendarId],
          Calendar.ReminderStatus.INCOMPLETE,
          new Date(2019, 3, 2),
          new Date(2019, 3, 5)
        );

        t.expect(Array.isArray(reminders)).toBe(true);
        t.expect(reminders.length).toBe(1);
        t.expect(reminders[0].id).toBe(reminderId);
        testReminderShape(t, reminders[0]);
      });

      t.afterAll(async () => {
        await Calendar.deleteReminderAsync(reminderId);
      });
    });

    t.describe('getReminderAsync()', () => {
      let reminderId;

      t.beforeAll(async () => {
        reminderId = await createTestReminderAsync(calendarId);
      });

      t.it('returns an array of reminders', async () => {
        const reminder = await Calendar.getReminderAsync(reminderId);

        t.expect(reminder).toBeDefined();
        t.expect(reminder.id).toBe(reminderId);
        testReminderShape(t, reminder);
      });

      t.afterAll(async () => {
        await Calendar.deleteReminderAsync(reminderId);
      });
    });

    t.describe('updateReminderAsync()', () => {
      let reminderId;

      t.beforeAll(async () => {
        reminderId = await createTestReminderAsync(calendarId);
      });

      t.it('updates a reminder', async () => {
        const dueDate = new Date();
        dueDate.setMilliseconds(0);

        const updatedReminderId = await Calendar.updateReminderAsync(reminderId, { dueDate });
        const reminder = await Calendar.getReminderAsync(updatedReminderId);

        t.expect(updatedReminderId).toBe(reminderId);
        t.expect(reminder.dueDate).toBe(dueDate.toISOString());
      });

      t.afterAll(async () => {
        await Calendar.deleteReminderAsync(reminderId);
      });
    });

    t.describe('deleteReminderAsync()', () => {
      let reminderId;

      t.beforeAll(async () => {
        reminderId = await createTestReminderAsync(calendarId);
      });

      t.it('deletes a reminder', async () => {
        await Calendar.deleteReminderAsync(reminderId);
        let error;

        try {
          await Calendar.getReminderAsync(reminderId);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(error instanceof Error).toBe(true);
      });

      t.afterAll(async () => {
        await Calendar.deleteReminderAsync(reminderId);
      });
    });

    t.afterAll(async () => {
      await Calendar.deleteCalendarAsync(calendarId);
    });
  });
}
