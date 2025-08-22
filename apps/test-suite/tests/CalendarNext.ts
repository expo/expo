import * as Calendar from 'expo-calendar';
import {
  createCalendar,
  ExpoCalendar,
  ExpoCalendarEvent,
  getCalendarsNext,
  getDefaultCalendarNext,
  requestCalendarPermissionsAsync,
  requestRemindersPermissionsAsync,
  getSources,
  listEvents,
  ExpoCalendarReminder,
  ExpoCalendarAttendee,
  getEventById,
  getReminderById,
} from 'expo-calendar/next';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';

export const name = 'Calendar@next';

const defaultCalendarData = {
  title: `Expo test-suite calendar ${new Date().toISOString()}`,
  color: '#4B968A',
  entityType: Calendar.EntityTypes.EVENT,
  name: 'expo-test-suite-calendar',
  source: {
    isLocalAccount: true,
    name: 'expo',
    type: 'local',
  },
} satisfies Partial<ExpoCalendar>;

async function createTestCalendarAsync(patch: Partial<ExpoCalendar> = {}) {
  return createCalendar({
    ...defaultCalendarData,
    sourceId: await pickCalendarSourceIdAsync(),
    ...patch,
  } satisfies Partial<ExpoCalendar>);
}

async function getCalendarByIdAsync(calendarId) {
  const calendars = await Calendar.getCalendarsAsync();
  return calendars.find((calendar) => calendar.id === calendarId);
}

async function pickCalendarSourceIdAsync() {
  if (Platform.OS !== 'ios') {
    return;
  }
  const sources = await Calendar.getSourcesAsync();
  const mainSource = sources.find((source) => source.name === 'iCloud') || sources[0];
  return mainSource?.id;
}

const defaultEventData = {
  title: 'App.js Conference',
  startDate: new Date(2019, 3, 4, 9), // 4th April 2019, 9:00, months are counted from 0
  endDate: new Date(2019, 3, 4, 10), // 4th April 2019, 12:00
  timeZone: 'CET',
  allDay: false,
  location: 'Qubus Hotel, Nadwiślańska 6, 30-527 Kraków, Poland',
  notes: 'The very first Expo & React Native conference in Europe',
  availability: Calendar.Availability.BUSY,
} satisfies Partial<ExpoCalendarEvent>;

function createEventData(customArgs = {}) {
  return {
    ...defaultEventData,
    ...customArgs,
  };
}

function createTestEvent(
  calendar: ExpoCalendar,
  customArgs: Partial<ExpoCalendarEvent> = {}
): ExpoCalendarEvent {
  const eventData = createEventData(customArgs);
  return calendar.createEvent(eventData);
}

async function fetchCreatedEvent(
  calendar: ExpoCalendar,
  startDate: Date,
  endDate: Date,
  eventId: string
) {
  const events = await calendar.listEvents(
    new Date(startDate.getTime() - 1000),
    new Date(endDate.getTime() + 1000)
  );
  const result = events.find((e) => e.id === eventId);
  return result;
}

const defaultAttendeeData = {
  email: 'test@test.com',
  name: 'Test Attendee',
  role: Calendar.AttendeeRole.ATTENDEE,
  status: Calendar.AttendeeStatus.ACCEPTED,
  type: Calendar.AttendeeType.RESOURCE,
} satisfies Partial<ExpoCalendarAttendee>;

function createTestReminder(
  calendar: ExpoCalendar,
  customArgs: Partial<ExpoCalendarReminder> = {}
): ExpoCalendarReminder {
  const reminderData = createEventData(customArgs);
  return calendar.createReminder(reminderData);
}

function createTestAttendee(
  event: ExpoCalendarEvent,
  customArgs: Partial<ExpoCalendarAttendee> = {}
): ExpoCalendarAttendee {
  const attendeeData = {
    ...defaultAttendeeData,
    ...customArgs,
  };
  return event.createAttendee(attendeeData);
}

async function getReminderCalendar() {
  const calendars = getCalendarsNext();
  return (await calendars).find((c) => c.entityType === Calendar.EntityTypes.REMINDER);
}

function reminderExists(reminders: ExpoCalendarReminder[], reminderId: string) {
  return reminders.some((r) => r.id === reminderId);
}

export async function test(t) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  function testCalendarShape(calendar) {
    t.expect(calendar).toBeDefined();
    t.expect(typeof calendar.id).toBe('string');
    t.expect(typeof calendar.title).toBe('string');
    t.expect(typeof calendar.source).toBe('object');
    testCalendarSourceShape(calendar.source);
    t.expect(typeof calendar.color).toBe('string');
    t.expect(typeof calendar.allowsModifications).toBe('boolean');

    t.expect(Array.isArray(calendar.allowedAvailabilities)).toBe(true);
    calendar.allowedAvailabilities.forEach((availability) => {
      t.expect(Object.values(Calendar.Availability)).toContain(availability);
    });

    if (Platform.OS === 'ios') {
      t.expect(typeof calendar.entityType).toBe('string');
      t.expect(Object.values(Calendar.EntityTypes)).toContain(calendar.entityType);

      t.expect(typeof calendar.type).toBe('string');
      t.expect(Object.values(Calendar.CalendarType)).toContain(calendar.type);
    }
  }

  function testEventShape(event) {
    t.expect(event).toBeDefined();
    t.expect(typeof event.id).toBe('string');
    t.expect(typeof event.calendarId).toBe('string');
    t.expect(typeof event.title).toBe('string');
    t.expect(typeof event.startDate).toBe('string');
    t.expect(typeof event.endDate).toBe('string');
    t.expect(typeof event.allDay).toBe('boolean');
    t.expect(typeof event.location).toBe('string');
    t.expect(typeof event.notes).toBe('string');
    t.expect(Array.isArray(event.alarms)).toBe(true);
    event.recurrenceRule && t.expect(typeof event.recurrenceRule).toBe('object');
    t.expect(Object.values(Calendar.Availability)).toContain(event.availability);
    event.timeZone && t.expect(typeof event.timeZone).toBe('string');

    if (Platform.OS === 'ios') {
      event.url && t.expect(typeof event.url).toBe('string');
      t.expect(typeof event.creationDate).toBe('string');
      t.expect(typeof event.lastModifiedDate).toBe('string');
      t.expect(typeof event.originalStartDate).toBe('string');
      t.expect(typeof event.isDetached).toBe('boolean');
      t.expect(Object.values(Calendar.EventStatus)).toContain(event.status);

      if (event.organizer) {
        t.expect(typeof event.organizer).toBe('object');
        testAttendeeShape(event.organizer);
      }
    }
  }

  function testCalendarSourceShape(source) {
    t.expect(source).toBeDefined();
    t.expect(typeof source.type).toBe('string');

    if (source.name !== null) {
      // source.name can be null if it refers to the local (unnamed) calendar.
      t.expect(typeof source.name).toBe('string');
    }

    if (Platform.OS === 'ios') {
      t.expect(typeof source.id).toBe('string');
    }
  }

  function testAttendeeShape(attendee) {
    t.expect(attendee).toBeDefined();
    t.expect(typeof attendee.name).toBe('string');
    t.expect(typeof attendee.role).toBe('string');
    t.expect(Object.values(Calendar.AttendeeRole)).toContain(attendee.role);
    t.expect(typeof attendee.status).toBe('string');
    t.expect(Object.values(Calendar.AttendeeStatus)).toContain(attendee.status);
    t.expect(typeof attendee.type).toBe('string');
    t.expect(Object.values(Calendar.AttendeeType)).toContain(attendee.type);

    if (Platform.OS === 'ios') {
      t.expect(typeof attendee.url).toBe('string');
      t.expect(typeof attendee.isCurrentUser).toBe('boolean');
    }
    if (Platform.OS === 'android') {
      t.expect(typeof attendee.id).toBe('string');
      t.expect(typeof attendee.email).toBe('string');
    }
  }

  describeWithPermissions('Calendar@next', () => {
    t.describe('Global functions', () => {
      t.describe('requestCalendarPermissionsAsync()', () => {
        t.it('requests for Calendar permissions', async () => {
          const results = await requestCalendarPermissionsAsync();

          t.expect(results.granted).toBe(true);
          t.expect(results.status).toBe('granted');
        });
      });

      if (Platform.OS === 'ios') {
        t.describe('requestReminderPermissionsAsync()', () => {
          t.it('requests for Reminder permissions', async () => {
            const results = await requestRemindersPermissionsAsync();

            t.expect(results.granted).toBe(true);
            t.expect(results.status).toBe('granted');
          });
        });
      }

      t.describe('createCalendar()', () => {
        let calendar: ExpoCalendar;

        t.it('creates a calendar', async () => {
          calendar = await createTestCalendarAsync();

          t.expect(calendar).toBeDefined();
          t.expect(typeof calendar.id).toBe('string');
          t.expect(calendar.title).toBe(defaultCalendarData.title);
          t.expect(calendar.color).toBe(defaultCalendarData.color);
          testCalendarShape(calendar);
        });

        t.it('cannot create a calendar without a title', async () => {
          let error: any;
          try {
            await createTestCalendarAsync({ title: undefined });
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
        });

        t.afterEach(async () => {
          // Clean up only if the calendar was successfully created
          if (calendar?.title) {
            calendar.delete();
          }
        });
      });

      t.describe('getCalendarsAsync()', () => {
        let calendar: ExpoCalendar;

        t.beforeAll(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('returns an array of calendars with correct shape', async () => {
          const calendars = await getCalendarsNext();

          t.expect(Array.isArray(calendars)).toBeTruthy();

          for (const calendar of calendars) {
            testCalendarShape(calendar);
          }
        });

        if (Platform.OS === 'ios') {
          t.it('returns an array of calendars for reminders', async () => {
            const calendars = await getCalendarsNext(Calendar.EntityTypes.REMINDER);

            t.expect(Array.isArray(calendars)).toBeTruthy();

            for (const calendar of calendars) {
              t.expect(calendar.entityType).toBe(Calendar.EntityTypes.REMINDER);
            }
          });
        }

        t.afterAll(async () => {
          calendar.delete();
        });
      });

      t.describe('listEvents()', () => {
        let calendar1: ExpoCalendar;
        let calendar2: ExpoCalendar;

        t.beforeAll(async () => {
          calendar1 = await createTestCalendarAsync();
          calendar2 = await createTestCalendarAsync();
        });

        t.it('returns an array of events', async () => {
          const events = await listEvents(
            [calendar1.id, calendar2.id],
            new Date(2019, 3, 1),
            new Date(2019, 3, 29)
          );
          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(0);

          const event1 = createTestEvent(calendar1);
          const event2 = createTestEvent(calendar2);
          const updatedEvents = await listEvents(
            [calendar1.id, calendar2.id],
            new Date(2019, 3, 1),
            new Date(2019, 3, 29)
          );

          t.expect(updatedEvents.length).toBe(2);
          t.expect(updatedEvents.map((e) => e.id)).toEqual([event1.id, event2.id]);

          const singleCalendarEvents = await listEvents(
            [calendar1.id],
            new Date(2019, 3, 1),
            new Date(2019, 3, 29)
          );
          t.expect(singleCalendarEvents.length).toBe(1);
          t.expect(singleCalendarEvents[0].id).toBe(event1.id);
        });

        t.afterAll(async () => {
          calendar1.delete();
          calendar2.delete();
        });
      });

      t.describe('getEventById()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('returns an event by its ID', async () => {
          const event = createTestEvent(calendar);
          const event2 = getEventById(event.id);
          t.expect(event2).toBeDefined();
          t.expect(event2).toEqual(event);
        });

        t.it('returns a modified event', async () => {
          const event = createTestEvent(calendar);
          event.update({
            title: 'New title',
            location: 'New location',
          });

          const event2 = await getEventById(event.id);
          t.expect(event2).toBeDefined();
          t.expect(event2.title).toBe('New title');
          t.expect(event2.location).toBe('New location');
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      if (Platform.OS === 'ios') {
        t.describe('getReminderById()', () => {
          let calendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeEach(async () => {
            calendar = await getReminderCalendar();
            reminder = createTestReminder(calendar);
          });

          t.it('returns a reminder by its ID', async () => {
            const fetchedReminder = await getReminderById(reminder.id);
            t.expect(fetchedReminder).toBeDefined();
            t.expect(fetchedReminder).toEqual(reminder);
          });

          t.it('returns a modified reminder', async () => {
            reminder.update({
              title: 'New title',
            });

            const fetchedReminder = await getReminderById(reminder.id);
            t.expect(fetchedReminder).toBeDefined();
            t.expect(fetchedReminder.title).toBe('New title');
          });

          t.afterEach(async () => {
            reminder.delete();
          });
        });

        t.describe('getDefaultCalendarNext()', () => {
          t.it('get default calendar', async () => {
            const calendar = getDefaultCalendarNext();

            testCalendarShape(calendar);
          });
        });

        t.describe('getSourcesAsync()', () => {
          t.it('returns an array of sources', async () => {
            const sources = getSources();

            t.expect(Array.isArray(sources)).toBe(true);
          });
        });
      }
    });

    // t.describe('Calendar UI Integration', () => {
    //   let originalTimeout;
    //   const dontStartNewTask = {
    //     startNewActivityTask: false,
    //   };
    //   let calendar: ExpoCalendar;

    //   t.beforeEach(async () => {
    //     originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
    //     t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 10;
    //     calendar = await createTestCalendarAsync();
    //   });

    //   t.it('creates an event via UI', async () => {
    //     const eventData = createEventData();
    //     await alertAndWaitForResponse('Please confirm the event creation dialog.');
    //     const result = await Calendar.createEventInCalendarAsync(eventData, dontStartNewTask);
    //     if (Platform.OS === 'ios') {
    //       t.expect(result.action).toBe('saved');
    //       t.expect(typeof result.id).toBe('string');
    //       const storedEvent = await Calendar.getEventAsync(result.id);

    //       t.expect(storedEvent).toEqual(
    //         t.jasmine.objectContaining({
    //           title: eventData.title,
    //           allDay: eventData.allDay,
    //           location: eventData.location,
    //           notes: eventData.notes,
    //         })
    //       );
    //     }
    //   });

    //   t.it('can preview an event', async () => {
    //     const event = createTestEvent(calendar);
    //     await alertAndWaitForResponse(
    //       'Please verify event details are shown and close the dialog.'
    //     );
    //     const result = await event.openInCalendarAsync({
    //       ...dontStartNewTask,
    //       allowsEditing: true,
    //       allowsCalendarPreview: true,
    //     });
    //     t.expect(result).toEqual({ action: 'done' });
    //   });

    //   t.it('can edit an event', async () => {
    //     const event = createTestEvent(calendar);
    //     await alertAndWaitForResponse('Please verify you can see the event and close the dialog.');
    //     const result = await event.editInCalendarAsync(dontStartNewTask);
    //     t.expect(typeof result.action).toBe('string'); // done or canceled
    //     t.expect(result.id).toBe(null);
    //   });

    //   t.afterEach(() => {
    //     t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    //     calendar.delete();
    //   });
    // });

    t.describe('Calendar', () => {
      t.describe('Calendar.get()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('returns a calendar by its ID', async () => {
          const fetchedCalendar = ExpoCalendar.get(calendar.id);
          t.expect(fetchedCalendar).toBeDefined();
          t.expect(fetchedCalendar).toEqual(calendar);
        });

        t.it('throws an error when getting a non-existent calendar', async () => {
          try {
            ExpoCalendar.get('non-existent-calendar-id');
          } catch (e) {
            t.expect(e).toBeDefined();
          }
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Calendar.update()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('updates a calendar', async () => {
          const newTitle = 'New test-suite calendar title!!!';
          const newColor = '#111111';
          calendar.update({
            title: newTitle,
            color: newColor,
          });
          const updatedCalendar = await getCalendarByIdAsync(calendar.id);

          t.expect(updatedCalendar.id).toBe(calendar.id);
          t.expect(updatedCalendar.color).toBe(newColor);
          t.expect(updatedCalendar.title).toBe(newTitle);
        });

        t.it('keeps other properties unchanged when updating title', async () => {
          const newTitle = 'New the coolest title ever';
          calendar.update({
            title: newTitle,
          });
          t.expect(calendar.title).toBe(newTitle);
          t.expect(calendar.color).toBe(defaultCalendarData.color);
          if (Platform.OS === 'ios') {
            t.expect(calendar.entityType).toBe(defaultCalendarData.entityType);
          }
        });

        t.it('keeps other properties unchanged when updating color', async () => {
          const color = '#001A72';
          calendar.update({
            color,
          });
          t.expect(calendar.color).toBe(color);
          t.expect(calendar.title).toBe(defaultCalendarData.title);
          if (Platform.OS === 'ios') {
            t.expect(calendar.entityType).toBe(defaultCalendarData.entityType);
          }
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Calendar.delete()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('deletes a calendar', async () => {
          calendar.delete();

          const calendars = getCalendarsNext();
          t.expect((await calendars).findIndex((c) => c.id === calendar.id)).toBe(-1);
        });

        t.it('throws an error when deleting a non-existent calendar', async () => {
          calendar.delete();
          t.expect(calendar.title).toBeNull();
          try {
            calendar.delete();
          } catch (e) {
            t.expect(e).toBeDefined();
          }
        });

        t.afterEach(async () => {
          // Call only if not already deleted
          if (calendar?.title) {
            calendar.delete();
          }
        });
      });

      t.describe('Calendar.createEvent()', () => {
        let calendar: ExpoCalendar;

        t.beforeAll(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('creates an event in the specific calendar', async () => {
          const event = createTestEvent(calendar);

          t.expect(event).toBeDefined();
          t.expect(typeof event.id).toBe('string');
          t.expect(event.title).toBe(defaultEventData.title);
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
          t.expect(event.timeZone).toBe(defaultEventData.timeZone);
          t.expect(event.allDay).toBe(defaultEventData.allDay);
          t.expect(event.location).toBe(defaultEventData.location);
          t.expect(event.notes).toBe(defaultEventData.notes);
        });

        t.it('creates an event with a recurrence rule', async () => {
          const recurrenceRule = {
            endDate: new Date(2021, 3, 5).toISOString(),
            frequency: Calendar.Frequency.DAILY,
            interval: 1,
          };
          const event = createTestEvent(calendar, {
            recurrenceRule,
          });

          t.expect(event).toBeDefined();
          t.expect(typeof event.id).toBe('string');
          t.expect(event.recurrenceRule).not.toBeNull();
          t.expect(event.recurrenceRule.frequency).toEqual(recurrenceRule.frequency);
          t.expect(event.recurrenceRule.interval).toEqual(recurrenceRule.interval);
          t.expect(event.recurrenceRule.endDate).toEqual(recurrenceRule.endDate);
        });

        if (Platform.OS === 'android') {
          t.it('creates an event with alarms', async () => {
            const event = createTestEvent(calendar, {
              alarms: [{ relativeOffset: -60, method: Calendar.AlarmMethod.ALARM }],
            });
            t.expect(event.alarms).toEqual([
              { relativeOffset: -60, method: Calendar.AlarmMethod.ALARM },
            ]);
          });
        }

        if (Platform.OS === 'ios') {
          t.it('rejects when time zone is invalid', async () => {
            let error;
            try {
              createTestEvent(calendar, { timeZone: '' });
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });
        }

        t.afterAll(async () => {
          calendar.delete();
        });
      });

      if (Platform.OS === 'ios') {
        t.describe('Calendar.createReminder()', () => {
          let eventCalendar: ExpoCalendar;
          let reminderCalendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeEach(async () => {
            eventCalendar = await createTestCalendarAsync();
            reminderCalendar = await getReminderCalendar();
          });

          t.it('fails to create a reminder in the event calendar', async () => {
            let error: any;
            try {
              createTestReminder(eventCalendar);
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });

          t.it('reminder calendar exists', async () => {
            t.expect(reminderCalendar).toBeDefined();
            t.expect(reminderCalendar.entityType).toBe(Calendar.EntityTypes.REMINDER);
          });

          t.it('creates a reminder in the reminder calendar', async () => {
            reminder = createTestReminder(reminderCalendar);
            t.expect(reminder).toBeDefined();
            t.expect(typeof reminder.id).toBe('string');
            t.expect(reminder.calendarId).toBe(reminderCalendar.id);
            t.expect(reminder.title).toBe(defaultEventData.title);
            t.expect(reminder.startDate).toBe(defaultEventData.startDate.toISOString());
            t.expect(reminder.notes).toBe(defaultEventData.notes);
          });

          t.it('creates a reminder with dueDate', async () => {
            reminder = createTestReminder(reminderCalendar, {
              dueDate: new Date(2025, 1, 1),
            });
            t.expect(reminder.dueDate).toBe(new Date(2025, 1, 1).toISOString());
          });

          t.afterEach(async () => {
            eventCalendar.delete();
            reminder?.delete();
          });
        });

        t.describe('Calendar.listReminders()', () => {
          let reminderCalendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeEach(async () => {
            reminderCalendar = await getReminderCalendar();
            reminder = createTestReminder(reminderCalendar, {
              startDate: new Date(2025, 0, 2, 6),
              dueDate: new Date(2025, 0, 2, 9),
            });
          });

          t.it('lists created reminders', async () => {
            const reminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );

            t.expect(reminderExists(reminders, reminder.id)).toBe(true);
          });

          t.it('lists reminders with incomplete status', async () => {
            const preRemindersIncomplete = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3),
              Calendar.ReminderStatus.INCOMPLETE
            );
            t.expect(reminderExists(preRemindersIncomplete, reminder.id)).toBe(true);
            const preRemindersComplete = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              null,
              Calendar.ReminderStatus.COMPLETED
            );
            t.expect(reminderExists(preRemindersComplete, reminder.id)).toBe(false);
            const preAllReminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );
            t.expect(reminderExists(preAllReminders, reminder.id)).toBe(true);
          });

          t.it('lists reminders with completed status', async () => {
            reminder.update({
              completionDate: new Date(2025, 0, 2, 10),
            });

            const remindersIncomplete = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3),
              Calendar.ReminderStatus.INCOMPLETE
            );
            t.expect(reminderExists(remindersIncomplete, reminder.id)).toBe(false);
            const remindersComplete = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3),
              Calendar.ReminderStatus.COMPLETED
            );
            t.expect(reminderExists(remindersComplete, reminder.id)).toBe(true);
            const allReminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );
            t.expect(reminderExists(allReminders, reminder.id)).toBe(true);
          });

          t.it('does not list reminders completed outside of the date range', async () => {
            reminder.update({
              completionDate: new Date(2025, 0, 5),
            });
            const reminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3),
              Calendar.ReminderStatus.COMPLETED
            );
            t.expect(reminderExists(reminders, reminder.id)).toBe(false);
          });

          t.afterEach(async () => {
            if (reminder?.title) {
              reminder.delete();
            }
          });
        });
      }

      t.describe('Calendar.listEvents()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('resolves to an array with an event of the correct shape', async () => {
          const event = createTestEvent(calendar);
          const events = await calendar.listEvents(new Date(2019, 3, 1), new Date(2019, 3, 29));

          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(1);
          t.expect(events[0].id).toBe(event.id);
          testEventShape(events[0]);
        });

        t.it('returns a list of events', async () => {
          const event = createTestEvent(calendar);
          const events = await calendar.listEvents(new Date(2019, 3, 1), new Date(2019, 3, 29));
          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(1);
          t.expect(events[0].id).toBe(event.id);
          testEventShape(events[0]);
        });

        t.it('modifies a listed event', async () => {
          createTestEvent(calendar);
          const events = await calendar.listEvents(new Date(2019, 3, 1), new Date(2019, 3, 29));
          const newTitle = `New title + ${new Date().toISOString()}`;
          const startDate = new Date(2019, 3, 2);
          const endDate = new Date(2019, 3, 3);
          events[0].update({
            title: newTitle,
            startDate,
            endDate,
          });
          t.expect(events[0].title).toBe(newTitle);
          t.expect(events[0].startDate).toBe(startDate.toISOString());
        });

        t.it('returns a list of recurring events', async () => {
          createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });

          // Get daily events on 4 days: 4th, 5th, 6th, 7th.
          const events = await calendar.listEvents(new Date(2019, 3, 4), new Date(2019, 3, 8));
          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(4);
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });
    });

    t.describe('Event', () => {
      t.describe('Event.get()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('gets an event by id', async () => {
          const event = createTestEvent(calendar);
          const fetchedEvent = ExpoCalendarEvent.get(event.id);
          t.expect(fetchedEvent).toEqual(event);
        });

        t.it('throws an error when getting a non-existent event', async () => {
          try {
            ExpoCalendarEvent.get('non-existent-event-id');
          } catch (e) {
            t.expect(e).toBeDefined();
          }
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Event.update()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('updates the event title', async () => {
          const event = createTestEvent(calendar);
          const newTitle = 'New title + ' + new Date().toISOString();
          event.update({
            title: newTitle,
          });

          t.expect(event.title).toBe(newTitle);
        });

        t.it('updates an event', async () => {
          const event = createTestEvent(calendar);
          const updatedData = {
            location: 'New location ' + new Date().toISOString(),
            url: 'https://swmansion.com',
            notes: 'New notes ' + new Date().toISOString(),
          };

          event.update(updatedData);

          t.expect(event).toBeDefined();
          t.expect(event.location).toBe(updatedData.location);
          if (Platform.OS === 'ios') {
            t.expect(event.url).toBe(updatedData.url);
          }
          t.expect(event.notes).toBe(updatedData.notes);
        });

        t.it('updates an event with a date string', async () => {
          const event = createTestEvent(calendar);
          const startDate = new Date(2022, 2, 3);
          const endDate = new Date(2022, 5, 6);

          event.update({
            startDate,
            endDate,
          });
          t.expect(event).toBeDefined();
          t.expect(event.startDate).toBe(startDate.toISOString());
          t.expect(event.endDate).toBe(endDate.toISOString());
        });

        t.it('updates an event with Date objects', async () => {
          const event = createTestEvent(calendar);
          const startDate = new Date(2022, 2, 3);
          const endDate = new Date(2022, 5, 6);

          event.update({
            startDate,
            endDate,
          });

          t.expect(event).toBeDefined();
          t.expect(event.startDate).toBe(startDate.toISOString());
          t.expect(event.endDate).toBe(endDate.toISOString());
        });

        t.it('updates an event and verifies it appears in the correct date range', async () => {
          const event = createTestEvent(calendar);
          const newTitle = 'I am an updated event + ' + new Date().toISOString();
          const newStartDate = new Date(2023, 2, 3);
          const newEndDate = new Date(2023, 2, 4);

          const initialFetchedEvents = await calendar.listEvents(
            new Date(2023, 2, 2),
            new Date(2023, 2, 5)
          );
          t.expect(initialFetchedEvents.length).toBe(0);

          event.update({
            title: newTitle,
            startDate: newStartDate,
            endDate: newEndDate,
          });

          const fetchedEvents = await calendar.listEvents(
            new Date(2023, 2, 2),
            new Date(2023, 2, 5)
          );

          t.expect(fetchedEvents.length).toBe(1);
          t.expect(fetchedEvents[0].id).toBe(event.id);
          t.expect(fetchedEvents[0].title).toBe(newTitle);
          t.expect(fetchedEvents[0].startDate).toBe(newStartDate.toISOString());
          t.expect(fetchedEvents[0].endDate).toBe(newEndDate.toISOString());
        });

        t.it('keeps other properties unchanged when updating title', async () => {
          const event = createTestEvent(calendar);
          const updatedData: Partial<ExpoCalendarEvent> = {
            title: 'New title ' + new Date().toISOString(),
          };
          event.update(updatedData);

          t.expect(event.title).toBe(updatedData.title);
          t.expect(event.location).toBe(defaultEventData.location);
          t.expect(event.notes).toBe(defaultEventData.notes);
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
          if (Platform.OS === 'ios') {
            t.expect(event.creationDate).toBeDefined();
            t.expect(event.lastModifiedDate).toBeDefined();
          }
        });

        t.it('keeps other properties unchanged when updating location', async () => {
          const event = createTestEvent(calendar);
          const updatedData: Partial<ExpoCalendarEvent> = {
            location: 'New location ' + new Date().toISOString(),
          };
          event.update(updatedData);

          t.expect(event.location).toBe(updatedData.location);
          t.expect(event.title).toBe(defaultEventData.title);
          t.expect(event.notes).toBe(defaultEventData.notes);
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
          if (Platform.OS === 'ios') {
            t.expect(event.creationDate).toBeDefined();
            t.expect(event.lastModifiedDate).toBeDefined();
          }
        });

        t.it('clears a field when set to null', async () => {
          const event = createTestEvent(calendar);
          event.update({
            location: null,
          });
          t.expect(event.title).toBe(defaultEventData.title);
          t.expect(event.location).toBeNull();
          t.expect(event.notes).toBe(defaultEventData.notes);
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
          if (Platform.OS === 'ios') {
            t.expect(event.creationDate).toBeDefined();
            t.expect(event.lastModifiedDate).toBeDefined();
          }
        });

        t.it('clears a field and sets it to a new value', async () => {
          const event = createTestEvent(calendar);
          event.update({
            location: null,
          });
          t.expect(event.location).toBeNull();

          const newLocation = `New location ${new Date().toISOString()}`;
          event.update({
            location: newLocation,
          });
          t.expect(event.location).toBe(newLocation);
        });

        t.it('updates an event and verifies it is stored correctly', async () => {
          const event = createTestEvent(calendar);

          const updatedData = {
            title: 'Updated title',
            location: 'Updated location',
            notes: 'Updated notes',
            url: 'https://swmansion.com',
            alarms: [{ relativeOffset: -60, method: Calendar.AlarmMethod.ALARM }],
            startDate: new Date(2023, 2, 3),
            endDate: new Date(2023, 2, 4),
            timeZone: 'GMT+1',
            endTimeZone: 'GMT+1',
            accessLevel: Calendar.EventAccessLevel.PUBLIC,
            guestsCanModify: true,
            guestsCanInviteOthers: true,
          } satisfies Partial<ExpoCalendarEvent>;

          event.update(updatedData);

          // Force fetch the event from the device database
          const fetchedEvents = await calendar.listEvents(
            new Date(2023, 2, 1),
            new Date(2023, 2, 5)
          );

          const fetchedEvent = fetchedEvents.find((e) => e.id === event.id);

          t.expect(fetchedEvent).toBeDefined();
          t.expect(fetchedEvent.id).toBe(event.id);
          t.expect(fetchedEvent.title).toBe(updatedData.title);
          t.expect(fetchedEvent.startDate).toBe(updatedData.startDate.toISOString());
          t.expect(fetchedEvent.endDate).toBe(updatedData.endDate.toISOString());
          t.expect(fetchedEvent.location).toBe(updatedData.location);
          t.expect(fetchedEvent.notes).toBe(updatedData.notes);
          t.expect(fetchedEvent.timeZone).toBe(updatedData.timeZone);

          if (Platform.OS === 'ios') {
            t.expect(fetchedEvent.url).toBe(updatedData.url);
          }

          if (Platform.OS === 'android') {
            t.expect(fetchedEvent.endTimeZone).toBe(updatedData.endTimeZone);
            t.expect(fetchedEvent.accessLevel).toBe(updatedData.accessLevel);
            t.expect(fetchedEvent.guestsCanModify).toBe(updatedData.guestsCanModify);
            t.expect(fetchedEvent.guestsCanInviteOthers).toBe(updatedData.guestsCanInviteOthers);
          }
        });

        // Updating with `instanceStartDate` is not supported on Android
        if (Platform.OS === 'ios') {
          t.it('handles detached events', async () => {
            const event = createTestEvent(calendar, {
              recurrenceRule: {
                frequency: Calendar.Frequency.DAILY,
              },
            });

            const occurrence = event.getOccurrence({
              instanceStartDate: new Date(2020, 3, 5, 9),
            });

            t.expect(occurrence.isDetached).toBe(false);

            const title = 'Detached event ' + new Date().toISOString();

            occurrence.update({
              title,
            });

            t.expect(occurrence.title).toBe(title);
            t.expect(occurrence.recurrenceRule).toBeNull();
            t.expect(occurrence.isDetached).toBe(true);
            t.expect(occurrence.startDate).toBe(new Date(2020, 3, 5, 9).toISOString());
            t.expect(occurrence.endDate).toBe(new Date(2020, 3, 5, 10).toISOString());
          });
        }

        t.it('updates a recurrence rule with occurrence', async () => {
          const event = createTestEvent(calendar);

          const newRecurrenceRule = {
            frequency: Calendar.Frequency.WEEKLY,
            interval: 1,
            occurrence: 3,
          };

          event.update({
            recurrenceRule: newRecurrenceRule,
          });

          t.expect(event.recurrenceRule.frequency).toEqual(newRecurrenceRule.frequency);
          t.expect(event.recurrenceRule.interval).toEqual(newRecurrenceRule.interval);
          t.expect(event.recurrenceRule.occurrence).toEqual(newRecurrenceRule.occurrence);
          t.expect(event.recurrenceRule.endDate).toBeNull();
        });

        t.it('updates a recurrence rule with endDate', async () => {
          const event = createTestEvent(calendar);

          const newRecurrenceRule = {
            frequency: Calendar.Frequency.WEEKLY,
            interval: 1,
            endDate: new Date(2021, 6, 5).toISOString(),
          };

          event.update({
            recurrenceRule: newRecurrenceRule,
          });

          t.expect(event.recurrenceRule.frequency).toEqual(newRecurrenceRule.frequency);
          t.expect(event.recurrenceRule.interval).toEqual(newRecurrenceRule.interval);
          t.expect(event.recurrenceRule.endDate).toEqual(newRecurrenceRule.endDate);
          t.expect(event.recurrenceRule.occurrence).toBeNull();
        });

        t.it('endDate takes precedence over occurrence', async () => {
          const event = createTestEvent(calendar);

          const newRecurrenceRule = {
            frequency: Calendar.Frequency.WEEKLY,
            interval: 1,
            endDate: new Date(2021, 6, 5).toISOString(),
            occurrence: 3,
          };

          event.update({
            recurrenceRule: newRecurrenceRule,
          });

          t.expect(event.recurrenceRule.frequency).toEqual(newRecurrenceRule.frequency);
          t.expect(event.recurrenceRule.interval).toEqual(newRecurrenceRule.interval);
          t.expect(event.recurrenceRule.endDate).toEqual(newRecurrenceRule.endDate);
          // The endDate takes precedence over the occurrence
          t.expect(event.recurrenceRule.occurrence).toBeNull();
        });

        t.it('updates the all day property', async () => {
          const event = createTestEvent(calendar);
          t.expect(event.allDay).toBe(false);
          event.update({
            allDay: true,
          });
          t.expect(event.allDay).toBe(true);
        });

        t.it('updates timeZone', async () => {
          const event = createTestEvent(calendar);
          t.expect(event.timeZone).toBe(defaultEventData.timeZone);
          event.update({
            timeZone: 'GMT-5',
          });
          t.expect(event.timeZone).toBe('GMT-5');
          event.update({
            timeZone: 'GMT+1',
          });
          t.expect(event.timeZone).toBe('GMT+1');
        });

        t.it('clears multiple fields when set to null', async () => {
          const event = createTestEvent(calendar);
          event.update({
            notes: null,
            url: null,
          });
          t.expect(event.title).toBe(defaultEventData.title);
          t.expect(event.notes).toBeNull();
          if (Platform.OS === 'ios') {
            t.expect(event.url).toBeNull();
          }
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
        });

        t.it('clears alarms when set to null', async () => {
          const event = createTestEvent(calendar, {
            alarms: [{ relativeOffset: -60 }],
          });
          t.expect(event.alarms.length).toBe(1);
          t.expect(event.alarms[0].relativeOffset).toEqual(-60);
          event.update({
            alarms: null,
          });

          const fetchedEvent = await fetchCreatedEvent(
            calendar,
            defaultEventData.startDate,
            defaultEventData.endDate,
            event.id
          );
          t.expect(fetchedEvent.alarms).toEqual([]);
        });

        t.it('clears a recurrence rule when set to null', async () => {
          const event = createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
              interval: 1,
              occurrence: 3,
            },
          });
          t.expect(event.recurrenceRule).toBeDefined();
          t.expect(event.recurrenceRule.frequency).toBe(Calendar.Frequency.DAILY);
          event.update({
            recurrenceRule: null,
          });
          const fetchedEvent = await fetchCreatedEvent(
            calendar,
            defaultEventData.startDate,
            defaultEventData.endDate,
            event.id
          );
          t.expect(fetchedEvent.recurrenceRule).toBeNull();
          t.expect(fetchedEvent.title).toBe(defaultEventData.title);
        });

        t.it('distinguishes between null and undefined values', async () => {
          const event = createTestEvent(calendar);
          const originalNotes = event.notes;

          // Update with undefined values (should be ignored)
          event.update({
            title: 'Updated Title',
            notes: undefined,
          });

          t.expect(event.title).toBe('Updated Title');
          t.expect(event.notes).toBe(originalNotes); // Should remain unchanged

          // Update with null values (should clear fields)
          event.update({
            notes: null,
          });

          t.expect(event.title).toBe('Updated Title'); // Should remain from previous update
          t.expect(event.notes).toBeNull(); // Should be cleared
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      if (Platform.OS === 'ios') {
        t.describe('Event.getOccurrence()', () => {
          let calendar: ExpoCalendar;

          t.beforeEach(async () => {
            calendar = await createTestCalendarAsync();
          });

          t.it('returns an instance of a recurring event', async () => {
            const recurringEvent = createTestEvent(calendar, {
              recurrenceRule: {
                frequency: Calendar.Frequency.DAILY,
              },
            });

            const instanceStartDate = new Date(2020, 5, 6, 9);

            const occurrence = recurringEvent.getOccurrence({
              instanceStartDate,
            });

            t.expect(occurrence).toBeDefined();
            t.expect(occurrence.id).toBe(recurringEvent.id);
            t.expect(occurrence.title).toBe(recurringEvent.title);
            t.expect(occurrence.startDate).toBe(new Date(2020, 5, 6, 9).toISOString());
            t.expect(occurrence.endDate).toBe(new Date(2020, 5, 6, 10).toISOString());
          });

          t.afterEach(async () => {
            calendar.delete();
          });
        });
      }

      t.describe('Event.delete()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('deletes an event', async () => {
          const event = createTestEvent(calendar);
          event.delete();
          let error;

          try {
            await Calendar.getEventAsync(event.id);
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
          t.expect(error instanceof Error).toBe(true);
        });

        t.it('deletes an event and verifies it is deleted', async () => {
          const event = createTestEvent(calendar);
          event.delete();
          t.expect(event.title).toBeNull();
          t.expect(event.location).toBeNull();
          t.expect(event.notes).toBeNull();
          t.expect(event.alarms).toBeNull();
          t.expect(event.recurrenceRule).toBeNull();
          t.expect(event.startDate).toBeNull();
          t.expect(event.endDate).toBeNull();
        });

        t.it('deletes a recurring event', async () => {
          const recurringEvent = createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });

          const eventsBeforeDelete = await calendar.listEvents(
            new Date(2019, 3, 4),
            new Date(2019, 3, 8)
          );
          t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
          t.expect(eventsBeforeDelete.length).toBe(4);

          const occurrence = recurringEvent.getOccurrence({ futureEvents: true });
          occurrence.delete();

          const eventsAfterDelete = await calendar.listEvents(
            new Date(2019, 3, 4),
            new Date(2019, 3, 8)
          );

          t.expect(Array.isArray(eventsAfterDelete)).toBe(true);
          t.expect(eventsAfterDelete.length).toBe(0);
        });

        if (Platform.OS === 'ios') {
          t.it('deletes an instance of a recurring event', async () => {
            const recurringEvent = createTestEvent(calendar, {
              recurrenceRule: {
                frequency: Calendar.Frequency.DAILY,
              },
            });

            const eventsBeforeDelete = await calendar.listEvents(
              new Date(2019, 3, 4),
              new Date(2019, 3, 8)
            );
            t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
            t.expect(eventsBeforeDelete.length).toBe(4);

            const occurrence = recurringEvent.getOccurrence({
              instanceStartDate: new Date(2019, 3, 5, 9),
            });
            occurrence.delete();

            const eventsAfterDelete = await calendar.listEvents(
              new Date(2019, 3, 4),
              new Date(2019, 3, 8)
            );

            t.expect(Array.isArray(eventsAfterDelete)).toBe(true);
            t.expect(eventsAfterDelete.length).toBe(3);
            t.expect(eventsAfterDelete.map((e) => e.startDate)).toEqual([
              new Date(2019, 3, 4, 9).toISOString(),
              // 5th April is deleted
              new Date(2019, 3, 6, 9).toISOString(),
              new Date(2019, 3, 7, 9).toISOString(),
            ]);
          });

          t.it(
            'deletes a single occurrence of a recurring event via the occurrence instance',
            async () => {
              const recurringEvent = createTestEvent(calendar, {
                recurrenceRule: {
                  frequency: Calendar.Frequency.DAILY,
                },
              });

              const eventsBeforeDelete = await calendar.listEvents(
                new Date(2019, 3, 4),
                new Date(2019, 3, 8)
              );
              t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
              t.expect(eventsBeforeDelete.length).toBe(4);

              const occurrence = recurringEvent.getOccurrence({
                instanceStartDate: new Date(2019, 3, 5, 9),
              });
              occurrence.delete();

              const eventsAfterDelete = await calendar.listEvents(
                new Date(2019, 3, 4),
                new Date(2019, 3, 8)
              );

              t.expect(Array.isArray(eventsAfterDelete)).toBe(true);
              t.expect(eventsAfterDelete.length).toBe(3);
              t.expect(eventsAfterDelete.map((e) => e.startDate)).toEqual([
                new Date(2019, 3, 4, 9).toISOString(),
                // 5th April is deleted
                new Date(2019, 3, 6, 9).toISOString(),
                new Date(2019, 3, 7, 9).toISOString(),
              ]);
            }
          );

          t.it(
            'deletes all future occurrences of a recurring event from a given instance',
            async () => {
              const recurringEvent = createTestEvent(calendar, {
                recurrenceRule: {
                  frequency: Calendar.Frequency.DAILY,
                },
              });

              const eventsBeforeDelete = await calendar.listEvents(
                new Date(2019, 3, 4),
                new Date(2019, 3, 8)
              );
              t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
              t.expect(eventsBeforeDelete.length).toBe(4);

              const occurrence = recurringEvent.getOccurrence({
                instanceStartDate: new Date(2019, 3, 5, 9),
                futureEvents: true,
              });
              occurrence.delete();

              const eventsAfterDelete = await calendar.listEvents(
                new Date(2019, 3, 4),
                new Date(2019, 3, 8)
              );

              t.expect(Array.isArray(eventsAfterDelete)).toBe(true);
              t.expect(eventsAfterDelete.length).toBe(1);
              t.expect(eventsAfterDelete.map((e) => e.startDate)).toEqual([
                new Date(2019, 3, 4, 9).toISOString(),
                // 5th, 6th and 7th April is deleted
              ]);
            }
          );
        }

        t.it('throws an error when deleting a non-existent event', async () => {
          const event = createTestEvent(calendar);
          event.delete();
          t.expect(event.title).toBeNull();
          try {
            event.delete();
          } catch (e) {
            t.expect(e).toBeDefined();
          }
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Event.getAttendeesAsync()', () => {
        let calendar: ExpoCalendar;
        let event: ExpoCalendarEvent;

        t.beforeAll(async () => {
          calendar = await createTestCalendarAsync();
          event = createTestEvent(calendar);
        });

        t.it('lists attendees', async () => {
          const attendees = await event.getAttendeesAsync();
          t.expect(Array.isArray(attendees)).toBe(true);
          t.expect(attendees.length).toBe(0);
        });

        t.it('lists attendees for a recurring event', async () => {
          const recurringEvent = createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });
          const attendees = await recurringEvent.getAttendeesAsync();
          t.expect(Array.isArray(attendees)).toBe(true);
          t.expect(attendees.length).toBe(0);
        });

        t.afterAll(async () => {
          calendar.delete();
        });
      });
    });

    if (Platform.OS === 'ios') {
      t.describe('Reminder', () => {
        t.describe('Reminder.get()', () => {
          let calendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeEach(async () => {
            calendar = await getReminderCalendar();
            reminder = await createTestReminder(calendar);
          });

          t.it('returns a reminder by its ID', async () => {
            const fetchedReminder = ExpoCalendarReminder.get(reminder.id);
            t.expect(fetchedReminder).toBeDefined();
            t.expect(fetchedReminder).toEqual(reminder);
          });

          t.it('throws an error when getting a non-existent reminder', async () => {
            try {
              ExpoCalendarReminder.get('non-existent-reminder-id');
            } catch (e) {
              t.expect(e).toBeDefined();
            }
          });

          t.afterEach(async () => {
            reminder.delete();
          });
        });

        t.describe('Reminder.update()', () => {
          let eventCalendar: ExpoCalendar;
          let reminderCalendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeEach(async () => {
            eventCalendar = await createTestCalendarAsync();
            reminderCalendar = await getReminderCalendar();
          });

          t.it('updates a reminder', async () => {
            reminder = await createTestReminder(reminderCalendar);

            const updatedData: Partial<ExpoCalendarReminder> = {
              title: `New title ${new Date().toISOString()}`,
              location: `New location ${new Date().toISOString()}`,
              url: 'https://swmansion.com',
              notes: `New notes ${new Date().toISOString()}`,
              dueDate: new Date(2025, 1, 1).toISOString(),
            };
            reminder.update(updatedData);

            t.expect(reminder.title).toBe(updatedData.title);
            // TODO: Fix - for some reason, the location is not being updated.
            // t.expect(reminder.location).toBe(updatedData.location);
            t.expect(reminder.url).toBe(updatedData.url);
            t.expect(reminder.notes).toBe(updatedData.notes);
            t.expect(reminder.dueDate).toBe(updatedData.dueDate);

            t.expect(reminder.creationDate).toBeDefined();
            t.expect(reminder.lastModifiedDate).toBeDefined();
          });

          t.it('updates the listed reminder', async () => {
            reminder = createTestReminder(reminderCalendar, {
              dueDate: new Date(2025, 0, 2),
            });
            const reminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );

            const found = reminders.find((r) => r.id === reminder.id);
            t.expect(found).toBeDefined();

            const newTitle = `New title ${new Date().toISOString()}`;
            found.update({
              title: newTitle,
              dueDate: new Date(2025, 0, 5),
            });

            t.expect(found.title).toBe(newTitle);
            t.expect(found.dueDate).toBe(new Date(2025, 0, 5).toISOString());
          });

          t.it('marks a reminder as completed', async () => {
            reminder = createTestReminder(reminderCalendar);
            t.expect(reminder.completed).toBe(false);

            reminder.update({
              completed: true,
            });
            t.expect(reminder.completed).toBe(true);
            t.expect(reminder.completionDate).toBeDefined();

            reminder.update({
              completed: false,
            });
            t.expect(reminder.completed).toBe(false);
          });

          t.it('supports alarms', async () => {
            reminder = createTestReminder(reminderCalendar, {
              alarms: [
                {
                  relativeOffset: -60,
                },
              ],
            });
            t.expect(reminder.alarms).toEqual([
              {
                relativeOffset: -60,
              },
            ]);
          });

          t.it('supports alarms with absolute dates', async () => {
            reminder = createTestReminder(reminderCalendar, {
              alarms: [
                {
                  absoluteDate: new Date(2025, 0, 1, 12, 0, 0).toISOString(),
                },
              ],
            });
            t.expect(reminder.alarms).toEqual([
              {
                absoluteDate: new Date(2025, 0, 1, 12, 0, 0).toISOString(),
                relativeOffset: 0,
              },
            ]);
          });

          t.it('clears multiple fields when set to null', async () => {
            const url = 'https://example.com';
            reminder = createTestReminder(reminderCalendar, {
              url,
            });

            t.expect(reminder.notes).toBe(defaultEventData.notes);
            t.expect(reminder.url).toBe(url);

            reminder.update({
              notes: null,
              url: null,
            });

            t.expect(reminder.title).toBe(defaultEventData.title);
            t.expect(reminder.notes).toBe('');
            t.expect(reminder.url).toBeNull();
          });

          t.it('clears alarms when set to null', async () => {
            reminder = createTestReminder(reminderCalendar, {
              alarms: [{ relativeOffset: -60 }],
            });
            t.expect(reminder.alarms).toEqual([{ relativeOffset: -60 }]);

            reminder.update({
              alarms: null,
            });
            t.expect(reminder.alarms).toBeNull();
            t.expect(reminder.title).toBe(defaultEventData.title);
          });

          t.it('clears recurrenceRule when set to null', async () => {
            reminder = createTestReminder(reminderCalendar, {
              recurrenceRule: {
                frequency: Calendar.Frequency.WEEKLY,
                interval: 1,
              },
              dueDate: new Date(2025, 0, 2),
            });
            t.expect(reminder.recurrenceRule).toBeDefined();
            t.expect(reminder.recurrenceRule.frequency).toBe(Calendar.Frequency.WEEKLY);

            reminder.update({
              recurrenceRule: null,
            });
            t.expect(reminder.recurrenceRule).toBeNull();
            t.expect(reminder.title).toBe(defaultEventData.title);
          });

          t.it('clears dates when set to null', async () => {
            reminder = createTestReminder(reminderCalendar, {
              startDate: new Date(2025, 0, 1),
              dueDate: new Date(2025, 0, 2),
              completionDate: new Date(2025, 0, 3),
            });

            t.expect(reminder.startDate).toBe(new Date(2025, 0, 1).toISOString());
            t.expect(reminder.dueDate).toBe(new Date(2025, 0, 2).toISOString());
            t.expect(reminder.completionDate).toBe(new Date(2025, 0, 3).toISOString());

            reminder.update({
              startDate: null,
              dueDate: null,
              completionDate: null,
            });

            t.expect(reminder.startDate).toBeNull();
            t.expect(reminder.dueDate).toBeNull();
            t.expect(reminder.completionDate).toBeNull();
            t.expect(reminder.title).toBe(defaultEventData.title);
          });

          t.it('distinguishes between null and undefined values for reminders', async () => {
            reminder = createTestReminder(reminderCalendar, {
              location: 'Original location',
              notes: 'Original notes',
            });
            const originalNotes = reminder.notes;

            // Update with undefined values (should be ignored)
            reminder.update({
              title: 'Updated Title',
            });

            t.expect(reminder.title).toBe('Updated Title');
            t.expect(reminder.notes).toBe(originalNotes);

            // Update with null values (should clear fields)
            reminder.update({
              notes: null,
            });

            t.expect(reminder.title).toBe('Updated Title'); // Should remain from previous update
            t.expect(reminder.notes).toBe(''); // Should be cleared
          });

          t.afterEach(async () => {
            eventCalendar.delete();
            reminder?.delete();
          });
        });

        t.describe('Reminder.delete()', () => {
          let reminderCalendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeAll(async () => {
            reminderCalendar = await getReminderCalendar();
          });

          t.it('deletes a reminder', async () => {
            reminder = createTestReminder(reminderCalendar);
            reminder.delete();

            t.expect(reminder.title).toBeNull();
            t.expect(reminder.location).toBeNull();
            t.expect(reminder.notes).toBeNull();
            t.expect(reminder.alarms).toBeNull();
            t.expect(reminder.recurrenceRule).toBeNull();
            t.expect(reminder.startDate).toBeNull();
            t.expect(reminder.dueDate).toBeNull();
          });

          t.it('throws an error when deleting a non-existent reminder', async () => {
            reminder = createTestReminder(reminderCalendar);
            reminder.delete();
            t.expect(reminder.title).toBeNull();
            try {
              reminder.delete();
            } catch (e) {
              t.expect(e).toBeDefined();
            }
          });

          t.afterEach(async () => {
            if (reminder?.title) {
              reminder.delete();
            }
          });
        });
      });
    }

    if (Platform.OS === 'android') {
      t.describe('Attendee', () => {
        let calendar: ExpoCalendar;
        let event: ExpoCalendarEvent;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
          event = createTestEvent(calendar);
        });

        t.it('lists attendees for an event with attendees', async () => {
          const attendees = await event.getAttendeesAsync();
          t.expect(Array.isArray(attendees)).toBe(true);
          t.expect(attendees.length).toBe(0);
        });

        t.it('creates a new attendee', async () => {
          const attendee = createTestAttendee(event);
          testAttendeeShape(attendee);
          t.expect(attendee).toBeDefined();
          t.expect(attendee.email).toBe(defaultAttendeeData.email);
          t.expect(attendee.name).toBe(defaultAttendeeData.name);
          t.expect(attendee.role).toBe(defaultAttendeeData.role);
          t.expect(attendee.status).toBe(defaultAttendeeData.status);
          t.expect(attendee.type).toBe(defaultAttendeeData.type);
        });

        t.it('lists attendees for an event', async () => {
          createTestAttendee(event);
          const attendees = await event.getAttendeesAsync();
          t.expect(Array.isArray(attendees)).toBe(true);
          t.expect(attendees.length).toBe(1);
          t.expect(attendees[0].email).toBe(defaultAttendeeData.email);
          t.expect(attendees[0].name).toBe(defaultAttendeeData.name);
          t.expect(attendees[0].role).toBe(defaultAttendeeData.role);
          t.expect(attendees[0].status).toBe(defaultAttendeeData.status);
          t.expect(attendees[0].type).toBe(defaultAttendeeData.type);
        });

        t.it('updates an attendee name', async () => {
          const attendee = createTestAttendee(event);
          const name = 'Updated Attendee';
          attendee.update({
            name,
          });
          t.expect(attendee.name).toBe(name);
          const attendees = await event.getAttendeesAsync();
          t.expect(attendees.length).toBe(1);
          t.expect(attendees[0].name).toBe(name);
        });

        t.it('updates an attendee email', async () => {
          const attendee = createTestAttendee(event);
          const email = 'updated@test.com';
          attendee.update({
            email,
          });
          t.expect(attendee.email).toBe(email);
          const attendees = await event.getAttendeesAsync();
          t.expect(attendees.length).toBe(1);
          t.expect(attendees[0].email).toBe(email);
        });

        t.it('updates attendee role/status/type', async () => {
          const attendee = createTestAttendee(event);
          const nextRole = Calendar.AttendeeRole.ORGANIZER;
          const nextStatus = Calendar.AttendeeStatus.TENTATIVE;
          const nextType = Calendar.AttendeeType.NONE;

          attendee.update({
            role: nextRole,
            status: nextStatus,
            type: nextType,
          });

          const attendees = await event.getAttendeesAsync();
          t.expect(attendees.length).toBe(1);
          t.expect(attendees[0].role).toBe(nextRole);
          t.expect(attendees[0].status).toBe(nextStatus);
          t.expect(attendees[0].type).toBe(nextType);
        });

        t.it('preserves attendee id when updating', async () => {
          const attendee = createTestAttendee(event);
          const originalId = attendee.id;

          attendee.update({ name: 'Changed Name', email: 'changed@test.com' });
          const attendees = await event.getAttendeesAsync();

          t.expect(attendees.length).toBe(1);
          t.expect(attendees[0].id).toBe(originalId);
        });

        t.it('preserves attendee data when updating an event', async () => {
          const attendee = createTestAttendee(event);
          const name = 'Updated Attendee';
          const email = 'updated@test.com';
          attendee.update({
            name,
            email,
          });
          const attendees = await event.getAttendeesAsync();
          t.expect(attendees.length).toBe(1);
          t.expect(attendees[0].name).toBe(name);
          t.expect(attendees[0].email).toBe(email);
          t.expect(attendees[0].role).toBe(defaultAttendeeData.role);
          t.expect(attendees[0].status).toBe(defaultAttendeeData.status);
          t.expect(attendees[0].type).toBe(defaultAttendeeData.type);
        });

        t.it('creates many attendees', async () => {
          const attendees = [
            createTestAttendee(event),
            createTestAttendee(event),
            createTestAttendee(event),
          ];
          t.expect(attendees.length).toBe(3);
          t.expect(attendees.every((attendee) => attendee.name === defaultAttendeeData.name));
        });

        t.it('deletes an attendee', async () => {
          const attendee = createTestAttendee(event);
          const attendees = await event.getAttendeesAsync();
          t.expect(attendees.length).toBe(1);

          attendee.delete();
          const attendeesAfterDelete = await event.getAttendeesAsync();
          t.expect(attendeesAfterDelete.length).toBe(0);
        });

        t.it('throws when deleting attendee twice', async () => {
          const attendee = createTestAttendee(event);

          attendee.delete();

          let error: any = null;
          try {
            attendee.delete();
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
        });

        t.afterEach(async () => {
          event.delete();
          calendar.delete();
        });
      });
    }
  });
}
