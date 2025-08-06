import * as Calendar from 'expo-calendar';
import {
  createCalendarNext,
  ExpoCalendar,
  ExpoCalendarEvent,
  getCalendarsNext,
  getDefaultCalendarNext,
  requestCalendarPermissionsAsync,
  requestRemindersPermissionsAsync,
  getSources,
  listEvents,
  ExpoCalendarReminder,
} from 'expo-calendar/next';
import { Platform } from 'react-native';

import { alertAndWaitForResponse } from './helpers';
import * as TestUtils from '../TestUtils';

export const name = 'Calendar@next';

const defaultCalendarData = {
  title: 'Expo test-suite calendar ' + new Date().toISOString(),
  color: '#4B968A',
  entityType: Calendar.EntityTypes.EVENT,
  //   name: 'expo-test-suite-calendar', TODO: Android only
  source: {
    isLocalAccount: true,
    name: 'expo',
    type: 'local',
  },
  ownerAccount: 'expo',
  accessLevel: Calendar.CalendarAccessLevel.OWNER,
} satisfies Partial<ExpoCalendar>;

async function createTestCalendarAsync(patch: Partial<ExpoCalendar> = {}) {
  return createCalendarNext({
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
  if (Platform.OS === 'ios') {
    const sources = await Calendar.getSourcesAsync();
    const mainSource = sources.find((source) => source.name === 'iCloud') || sources[0];
    return mainSource && mainSource.id;
  }
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

function createTestReminder(
  calendar: ExpoCalendar,
  customArgs: Partial<ExpoCalendarReminder> = {}
): ExpoCalendarReminder {
  const reminderData = createEventData(customArgs);
  return calendar.createReminder(reminderData);
}

function getReminderCalendar() {
  const calendars = getCalendarsNext();
  return calendars.find((c) => c.entityType === Calendar.EntityTypes.REMINDER);
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
    if (Platform.OS === 'android') {
      t.expect(typeof calendar.isPrimary).toBe('boolean');
      calendar.name && t.expect(typeof calendar.name).toBe('string');
      t.expect(typeof calendar.ownerAccount).toBe('string');
      calendar.timeZone && t.expect(typeof calendar.timeZone).toBe('string');

      t.expect(Array.isArray(calendar.allowedReminders)).toBe(true);
      calendar.allowedReminders.forEach((reminder) => {
        t.expect(Object.values(Calendar.AlarmMethod)).toContain(reminder);
      });

      t.expect(Array.isArray(calendar.allowedAttendeeTypes)).toBe(true);
      calendar.allowedAttendeeTypes.forEach((attendeeType) => {
        t.expect(Object.values(Calendar.AttendeeType)).toContain(attendeeType);
      });

      t.expect(typeof calendar.isVisible).toBe('boolean');
      t.expect(typeof calendar.isSynced).toBe('boolean');
      t.expect(typeof calendar.accessLevel).toBe('string');
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
    if (Platform.OS === 'android') {
      t.expect(typeof event.endTimeZone).toBe('string');
      t.expect(typeof event.organizerEmail).toBe('string');
      t.expect(Object.values(Calendar.EventAccessLevel)).toContain(event.accessLevel);
      t.expect(typeof event.guestsCanModify).toBe('boolean');
      t.expect(typeof event.guestsCanInviteOthers).toBe('boolean');
      t.expect(typeof event.guestsCanSeeGuests).toBe('boolean');
      event.originalId && t.expect(typeof event.originalId).toBe('string');
      event.instanceId && t.expect(typeof event.instanceId).toBe('string');
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
    if (Platform.OS === 'android') {
      t.expect(typeof source.isLocalAccount).toBe('boolean');
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

      t.describe('createCalendarNext()', () => {
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
          let error;
          try {
            await createTestCalendarAsync({ title: undefined });
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
        });

        t.afterAll(async () => {
          calendar.delete();
        });
      });

      t.describe('getCalendarsAsync()', () => {
        let calendar: ExpoCalendar;

        t.beforeAll(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('returns an array of calendars with correct shape', async () => {
          const calendars = getCalendarsNext();

          t.expect(Array.isArray(calendars)).toBeTruthy();

          for (const calendar of calendars) {
            testCalendarShape(calendar);
          }
        });

        if (Platform.OS === 'ios') {
          t.it('returns an array of calendars for reminders', async () => {
            const calendars = getCalendarsNext(Calendar.EntityTypes.REMINDER);

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
        t.it('returns an array of events', async () => {
          const calendar1 = await createTestCalendarAsync();
          const calendar2 = await createTestCalendarAsync();
          const events = listEvents(
            [calendar1.id, calendar2.id],
            new Date(2019, 3, 1),
            new Date(2019, 3, 29)
          );
          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(0);

          const event1 = await createTestEvent(calendar1);
          const event2 = await createTestEvent(calendar2);
          const updatedEvents = listEvents(
            [calendar1.id, calendar2.id],
            new Date(2019, 3, 1),
            new Date(2019, 3, 29)
          );
          t.expect(updatedEvents.length).toBe(2);
          t.expect(updatedEvents.map((e) => e.id)).toEqual([event1.id, event2.id]);

          const singleCalendarEvents = listEvents(
            [calendar1.id],
            new Date(2019, 3, 1),
            new Date(2019, 3, 29)
          );
          t.expect(singleCalendarEvents.length).toBe(1);
          t.expect(singleCalendarEvents[0].id).toBe(event1.id);
        });
      });

      if (Platform.OS === 'ios') {
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

    t.describe('Calendar UI Integration', () => {
      let originalTimeout;
      const dontStartNewTask = {
        startNewActivityTask: false,
      };

      t.beforeAll(async () => {
        originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 10;
      });
      t.afterAll(() => {
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });

      t.it('creates an event via UI', async () => {
        const eventData = createEventData();
        await alertAndWaitForResponse('Please confirm the event creation dialog.');
        const result = await Calendar.createEventInCalendarAsync(eventData, dontStartNewTask);
        if (Platform.OS === 'ios') {
          t.expect(result.action).toBe('saved');
          t.expect(typeof result.id).toBe('string');
          const storedEvent = await Calendar.getEventAsync(result.id);

          t.expect(storedEvent).toEqual(
            t.jasmine.objectContaining({
              title: eventData.title,
              allDay: eventData.allDay,
              location: eventData.location,
              notes: eventData.notes,
            })
          );
        } else {
          // t.expect(result.action).toBe('done');
          // t.expect(result.id).toBe(null);
        }
      });

      t.it('can preview an event', async () => {
        const calendar = await createTestCalendarAsync();
        const event = createTestEvent(calendar);
        await alertAndWaitForResponse(
          'Please verify event details are shown and close the dialog.'
        );
        const result = await event.openInCalendarAsync({
          ...dontStartNewTask,
          allowsEditing: true,
          allowsCalendarPreview: true,
        });
        t.expect(result).toEqual({ action: 'done' });
        calendar.delete();
      });

      t.it('can edit an event', async () => {
        const calendar = await createTestCalendarAsync();
        const event = createTestEvent(calendar);
        await alertAndWaitForResponse('Please verify you can see the event and close the dialog.');
        const result = await event.editInCalendarAsync(dontStartNewTask);
        t.expect(typeof result.action).toBe('string'); // done or canceled
        t.expect(result.id).toBe(null);
        calendar.delete();
      });
    });

    t.describe('Calendar', () => {
      t.describe('Calendar.update()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('updates a calendar', async () => {
          const newTitle = 'New test-suite calendar title';
          calendar.update({
            title: newTitle,
          });
          const updatedCalendar = await getCalendarByIdAsync(calendar.id);

          t.expect(updatedCalendar.id).toBe(calendar.id);
          t.expect(updatedCalendar.title).toBe(newTitle);
        });

        t.it('keeps other properties unchanged when updating title', async () => {
          const newTitle = 'New test-suite calendar title' + new Date().toISOString();
          calendar.update({
            title: newTitle,
          });
          t.expect(calendar.title).toBe(newTitle);
          t.expect(calendar.color).toBe(defaultCalendarData.color);
          t.expect(calendar.entityType).toBe(defaultCalendarData.entityType);
        });

        t.it('keeps other properties unchanged when updating color', async () => {
          const color = '#001A72';
          calendar.update({
            color,
          });
          t.expect(calendar.color).toBe(color);
          t.expect(calendar.title).toBe(defaultCalendarData.title);
          t.expect(calendar.entityType).toBe(defaultCalendarData.entityType);
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Calendar.delete()', () => {
        t.it('deletes a calendar', async () => {
          const calendar = await createTestCalendarAsync();
          calendar.delete();

          const calendars = getCalendarsNext();
          t.expect(calendars.findIndex((c) => c.id === calendar.id)).toBe(-1);
        });

        t.it('throws an error when deleting a non-existent calendar', async () => {
          const calendar = await createTestCalendarAsync();
          calendar.delete();
          t.expect(calendar.title).toBeNull();
          try {
            calendar.delete();
          } catch (e) {
            t.expect(e).toBeDefined();
          }
        });
      });

      t.describe('Calendar.createEvent()', () => {
        let calendar: ExpoCalendar;

        t.beforeAll(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('creates an event in the specific calendar', async () => {
          const event = await createTestEvent(calendar);

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

        t.it('creates an event with the recurrence rule', async () => {
          const recurrenceRule = {
            endDate: new Date(2021, 3, 5).toISOString(),
            frequency: Calendar.Frequency.DAILY,
            interval: 1,
          };
          const event = await createTestEvent(calendar, {
            recurrenceRule,
          });

          t.expect(event).toBeDefined();
          t.expect(typeof event.id).toBe('string');
          t.expect(event.recurrenceRule).not.toBeNull();
          t.expect(event.recurrenceRule.frequency).toEqual(recurrenceRule.frequency);
          t.expect(event.recurrenceRule.interval).toEqual(recurrenceRule.interval);
          t.expect(event.recurrenceRule.endDate).toEqual(recurrenceRule.endDate);
        });

        if (Platform.OS === 'ios') {
          t.it('rejects when time zone is invalid', async () => {
            let error;
            try {
              await createTestEvent(calendar, { timeZone: '' });
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
          let reminderCalendar: ExpoCalendar;
          let reminder: ExpoCalendarReminder;

          t.beforeAll(async () => {
            reminderCalendar = getReminderCalendar();
          });

          t.it('fails to create a reminder in the event calendar', async () => {
            const eventCalendar = await createTestCalendarAsync();

            let error;
            try {
              await createTestReminder(eventCalendar);
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();

            eventCalendar.delete();
          });

          t.it('reminder calendar exists', async () => {
            t.expect(reminderCalendar).toBeDefined();
            t.expect(reminderCalendar.entityType).toBe(Calendar.EntityTypes.REMINDER);
          });

          t.it('creates and deletes a reminder in the reminder calendar', async () => {
            reminder = await createTestReminder(reminderCalendar);
            t.expect(reminder).toBeDefined();
            t.expect(typeof reminder.id).toBe('string');
            t.expect(reminder.calendarId).toBe(reminderCalendar.id);
            t.expect(reminder.title).toBe(defaultEventData.title);
            t.expect(reminder.startDate).toBe(defaultEventData.startDate.toISOString());
            // t.expect(reminder.location).toBe(eventData.location);
            t.expect(reminder.notes).toBe(defaultEventData.notes);
          });

          t.it('creates a reminder with dueDate', async () => {
            reminder = await createTestReminder(reminderCalendar, {
              dueDate: new Date(2025, 1, 1),
            });
            t.expect(reminder.dueDate).toBe(new Date(2025, 1, 1).toISOString());
          });

          t.it('lists created reminders', async () => {
            const reminder = await createTestReminder(reminderCalendar, {
              dueDate: new Date(2025, 0, 2),
            });

            const reminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );

            const found = reminders.find((r) => r.id === reminder.id);
            t.expect(found).toBeDefined();
          });

          t.afterAll(async () => {
            reminder?.delete();
          });
        });

        t.describe('Calendar.listReminders()', () => {
          t.it('Calendar.listReminders()', async () => {
            const reminderCalendar = getReminderCalendar();
            const reminder = await createTestReminder(reminderCalendar);
            const reminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );

            const found = reminders.find((r) => r.id === reminder.id);
            t.expect(found).toBeDefined();

            reminder.delete();
          });
        });
      }

      t.describe('Calendar.listEvents()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('resolves to an array with an event of the correct shape', async () => {
          const event = await createTestEvent(calendar);
          const events = calendar.listEvents(new Date(2019, 3, 1), new Date(2019, 3, 29));

          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(1);
          t.expect(events[0].id).toBe(event.id);
          testEventShape(events[0]);
        });

        t.it('returns a list of events', async () => {
          const event = await createTestEvent(calendar);
          const events = calendar.listEvents(new Date(2019, 3, 1), new Date(2019, 3, 29));
          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(1);
          t.expect(events[0].id).toBe(event.id);
          testEventShape(events[0]);
        });

        t.it('modifies a listed event', async () => {
          await createTestEvent(calendar);
          const events = calendar.listEvents(new Date(2019, 3, 1), new Date(2019, 3, 29));
          const newTitle = 'New title + ' + new Date().toISOString();
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
          await createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });

          // Get daily events on 4 days: 4th, 5th, 6th, 7th.
          const events = calendar.listEvents(new Date(2019, 3, 4), new Date(2019, 3, 8));
          t.expect(Array.isArray(events)).toBe(true);
          t.expect(events.length).toBe(4);
        });

        t.it('returns an instance of a recurring event', async () => {
          const recurringEvent = await createTestEvent(calendar, {
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
    });

    t.describe('Event', () => {
      t.describe('Event.update()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('updates the event title', async () => {
          const event = await createTestEvent(calendar);
          const newTitle = 'New title + ' + new Date().toISOString();
          event.update({
            title: newTitle,
          });
          t.expect(event.title).toBe(newTitle);
        });

        t.it('updates an event', async () => {
          const event = await createTestEvent(calendar);
          const updatedData = {
            location: 'New location ' + new Date().toISOString(),
            url: 'https://swmansion.com',
            notes: 'New notes ' + new Date().toISOString(),
          };

          event.update(updatedData);

          t.expect(event).toBeDefined();
          t.expect(event.location).toBe(updatedData.location);
          t.expect(event.url).toBe(updatedData.url);
          t.expect(event.notes).toBe(updatedData.notes);
        });

        t.it('updates an event with a date string', async () => {
          const event = await createTestEvent(calendar);
          const startDate = new Date(2022, 2, 3);
          const endDate = new Date(2022, 5, 6);

          event.update({
            startDate,
            endDate,
          });

          t.expect(event).toBeDefined();
          t.expect(event.startDate).toBe(startDate.toISOString());
        });

        t.it('updates an event and verifies it appears in the correct date range', async () => {
          const event = await createTestEvent(calendar);
          const newTitle = 'I am an updated event + ' + new Date().toISOString();
          const newStartDate = new Date(2023, 2, 3);
          const newEndDate = new Date(2023, 2, 4);

          const initialFetchedEvents = calendar.listEvents(
            new Date(2023, 2, 2),
            new Date(2023, 2, 5)
          );
          t.expect(initialFetchedEvents.length).toBe(0);

          event.update({
            title: newTitle,
            startDate: newStartDate,
            endDate: newEndDate,
          });

          const fetchedEvents = calendar.listEvents(new Date(2023, 2, 2), new Date(2023, 2, 5));
          t.expect(fetchedEvents.length).toBe(1);
          t.expect(fetchedEvents[0].id).toBe(event.id);
          t.expect(fetchedEvents[0].title).toBe(newTitle);
          t.expect(fetchedEvents[0].startDate).toBe(newStartDate.toISOString());
        });

        t.it('keeps other properties unchanged when updating title', async () => {
          const event = await createTestEvent(calendar);
          const updatedData: Partial<ExpoCalendarEvent> = {
            title: 'New title ' + new Date().toISOString(),
          };
          event.update(updatedData);
          t.expect(event.title).toBe(updatedData.title);
          t.expect(event.location).toBe(defaultEventData.location);
          t.expect(event.notes).toBe(defaultEventData.notes);
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
          t.expect(event.creationDate).toBeDefined();
          t.expect(event.lastModifiedDate).toBeDefined();
        });

        t.it('keeps other properties unchanged when updating location', async () => {
          const event = await createTestEvent(calendar);
          const updatedData: Partial<ExpoCalendarEvent> = {
            location: 'New location ' + new Date().toISOString(),
          };
          event.update(updatedData);
          t.expect(event.location).toBe(updatedData.location);
          t.expect(event.title).toBe(defaultEventData.title);
          t.expect(event.notes).toBe(defaultEventData.notes);
          t.expect(event.startDate).toBe(defaultEventData.startDate.toISOString());
          t.expect(event.endDate).toBe(defaultEventData.endDate.toISOString());
          t.expect(event.creationDate).toBeDefined();
          t.expect(event.lastModifiedDate).toBeDefined();
        });

        t.it('handles detached events', async () => {
          const event = await createTestEvent(calendar, {
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

        t.it('updates recurrence rule', async () => {
          const event = await createTestEvent(calendar);

          const newRecurrenceRule = {
            frequency: Calendar.Frequency.WEEKLY,
            interval: 1,
            endDate: new Date(2021, 6, 5).toISOString(),
            occurrence: 0,
          };

          event.update({
            recurrenceRule: newRecurrenceRule,
          });

          t.expect(event.recurrenceRule).toEqual(newRecurrenceRule);
        });

        t.it('updates the all day property', async () => {
          const event = await createTestEvent(calendar);
          t.expect(event.allDay).toBe(false);
          event.update({
            allDay: true,
          });
          t.expect(event.allDay).toBe(true);
        });

        t.it('updates timeZone', async () => {
          const event = await createTestEvent(calendar);
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

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Event.delete()', () => {
        let calendar: ExpoCalendar;

        t.beforeEach(async () => {
          calendar = await createTestCalendarAsync();
        });

        t.it('deletes an event', async () => {
          const event = await createTestEvent(calendar);
          event.delete({});
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
          const event = await createTestEvent(calendar);
          event.delete({});
          t.expect(event.title).toBeNull();
          t.expect(event.location).toBeNull();
          t.expect(event.notes).toBeNull();
          t.expect(event.alarms).toBeNull();
          t.expect(event.recurrenceRule).toBeNull();
          t.expect(event.startDate).toBeNull();
          t.expect(event.endDate).toBeNull();
        });

        t.it('deletes a recurring event', async () => {
          const recurringEvent = await createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });

          const eventsBeforeDelete = calendar.listEvents(
            new Date(2019, 3, 4),
            new Date(2019, 3, 8)
          );
          t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
          t.expect(eventsBeforeDelete.length).toBe(4);

          recurringEvent.delete({
            futureEvents: true,
          });

          const eventsAfterDelete = calendar.listEvents(new Date(2019, 3, 4), new Date(2019, 3, 8));

          t.expect(Array.isArray(eventsAfterDelete)).toBe(true);
          t.expect(eventsAfterDelete.length).toBe(0);
        });

        t.it('deletes an instance of a recurring event', async () => {
          const recurringEvent = await createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });

          const eventsBeforeDelete = calendar.listEvents(
            new Date(2019, 3, 4),
            new Date(2019, 3, 8)
          );
          t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
          t.expect(eventsBeforeDelete.length).toBe(4);

          recurringEvent.delete({
            instanceStartDate: new Date(2019, 3, 5, 9),
          });

          const eventsAfterDelete = calendar.listEvents(new Date(2019, 3, 4), new Date(2019, 3, 8));

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
            const recurringEvent = await createTestEvent(calendar, {
              recurrenceRule: {
                frequency: Calendar.Frequency.DAILY,
              },
            });

            const eventsBeforeDelete = calendar.listEvents(
              new Date(2019, 3, 4),
              new Date(2019, 3, 8)
            );
            t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
            t.expect(eventsBeforeDelete.length).toBe(4);

            const occurrence = recurringEvent.getOccurrence({
              instanceStartDate: new Date(2019, 3, 5, 9),
            });
            occurrence.delete({
              futureEvents: false,
            });

            const eventsAfterDelete = calendar.listEvents(
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
            const recurringEvent = await createTestEvent(calendar, {
              recurrenceRule: {
                frequency: Calendar.Frequency.DAILY,
              },
            });

            const eventsBeforeDelete = calendar.listEvents(
              new Date(2019, 3, 4),
              new Date(2019, 3, 8)
            );
            t.expect(Array.isArray(eventsBeforeDelete)).toBe(true);
            t.expect(eventsBeforeDelete.length).toBe(4);

            const occurrence = recurringEvent.getOccurrence({
              instanceStartDate: new Date(2019, 3, 5, 9),
            });
            occurrence.delete({
              futureEvents: true,
            });

            const eventsAfterDelete = calendar.listEvents(
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

        t.it('throws an error when deleting a non-existent event', async () => {
          const event = await createTestEvent(calendar);
          event.delete({});
          t.expect(event.title).toBeNull();
          try {
            event.delete({});
          } catch (e) {
            t.expect(e).toBeDefined();
          }
        });

        t.afterEach(async () => {
          calendar.delete();
        });
      });

      t.describe('Event.getAttendees()', () => {
        let calendar: ExpoCalendar;
        let event: ExpoCalendarEvent;

        t.beforeAll(async () => {
          calendar = await createTestCalendarAsync();
          event = await createTestEvent(calendar);
        });

        t.it('lists attendees', () => {
          const attendees = event.getAttendees();
          t.expect(Array.isArray(attendees)).toBe(true);
          t.expect(attendees.length).toBe(0);
        });

        t.it('lists attendees for a recurring event', async () => {
          const recurringEvent = await createTestEvent(calendar, {
            recurrenceRule: {
              frequency: Calendar.Frequency.DAILY,
            },
          });
          const attendees = recurringEvent.getAttendees({
            instanceStartDate: new Date(2024, 0, 1, 9),
          });
          t.expect(Array.isArray(attendees)).toBe(true);
          t.expect(attendees.length).toBe(0);
        });

        t.afterAll(async () => {
          calendar.delete();
        });
      });
    });

    t.describe('Reminder', () => {
      if (Platform.OS === 'ios') {
        t.describe('Reminder.update()', () => {
          let eventCalendar: ExpoCalendar;
          let reminderCalendar: ExpoCalendar;

          t.beforeAll(async () => {
            eventCalendar = await createTestCalendarAsync();
            reminderCalendar = getReminderCalendar();
          });

          t.it('updates a reminder', async () => {
            const reminder = await createTestReminder(reminderCalendar);

            const updatedData: Partial<ExpoCalendarReminder> = {
              title: 'New title ' + new Date().toISOString(),
              location: 'New location ' + new Date().toISOString(),
              url: 'https://swmansion.com',
              notes: 'New notes ' + new Date().toISOString(),
              dueDate: new Date(2025, 1, 1).toISOString(),
            };
            reminder.update(updatedData);

            t.expect(reminder.title).toBe(updatedData.title);
            t.expect(reminder.creationDate).toBeDefined();
            t.expect(reminder.lastModifiedDate).toBeDefined();
            t.expect(reminder.url).toBe(updatedData.url);
            t.expect(reminder.notes).toBe(updatedData.notes);
            t.expect(reminder.dueDate).toBe(updatedData.dueDate);

            // Clean up the reminder
            reminder.delete();
          });

          t.it('updates the listed reminder', async () => {
            const reminder = await createTestReminder(reminderCalendar, {
              dueDate: new Date(2025, 0, 2),
            });
            const reminders = await reminderCalendar.listReminders(
              new Date(2025, 0, 1),
              new Date(2025, 0, 3)
            );

            const found = reminders.find((r) => r.id === reminder.id);
            t.expect(found).toBeDefined();

            const newTitle = 'New title ' + new Date().toISOString();
            found.update({
              title: newTitle,
              dueDate: new Date(2025, 0, 5),
            });

            t.expect(found.title).toBe(newTitle);
            t.expect(found.dueDate).toBe(new Date(2025, 0, 5).toISOString());

            // Clean up the reminder
            reminder.delete();
          });

          t.it('marks a reminder as completed', async () => {
            const reminder = await createTestReminder(reminderCalendar);
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
            const reminder = await createTestReminder(reminderCalendar, {
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
            const reminder = await createTestReminder(reminderCalendar, {
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

          t.afterAll(async () => {
            eventCalendar.delete();
          });
        });

        t.describe('Reminder.delete()', () => {
          t.it('deletes a reminder', async () => {
            const reminderCalendar = getReminderCalendar();
            const reminder = await createTestReminder(reminderCalendar);
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
            const reminderCalendar = getReminderCalendar();
            const reminder = await createTestReminder(reminderCalendar);
            reminder.delete();
            t.expect(reminder.title).toBeNull();
            try {
              reminder.delete();
            } catch (e) {
              t.expect(e).toBeDefined();
            }
          });
        });
      }
    });

    t.describe('Attendee', () => {
      // TODO: Add tests for attendees on Android
    });
  });
}
