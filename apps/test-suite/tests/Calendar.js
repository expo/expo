import { UnavailabilityError } from '@unimodules/core';
import * as Calendar from 'expo-calendar';
import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';

export const name = 'Calendar';

export function canRunAsync({ isAutomated }) {
  return !isAutomated;
}

export function requiresPermissions() {
  return [Permissions.CALENDAR];
}

async function createTestCalendarAsync(patch = {}) {
  return await Calendar.createCalendarAsync({
    title: 'Expo test-suite calendar',
    color: '#4B968A',
    entityType: Calendar.EntityTypes.EVENT,
    name: 'expo-test-suite-calendar',
    sourceId: await pickCalendarSourceIdAsync(),
    source: {
      isLocalAccount: true,
      name: 'expo',
    },
    ownerAccount: 'expo',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    ...patch,
  });
}

async function getCalendarByIdAsync(calendarId) {
  const calendars = await Calendar.getCalendarsAsync();
  return calendars.find(calendar => calendar.id === calendarId);
}

async function pickCalendarSourceIdAsync() {
  if (Platform.OS === 'ios') {
    const sources = await Calendar.getSourcesAsync();
    const mainSource = sources.find(source => source.name === 'iCloud') || sources[0];
    return mainSource && mainSource.id;
  }
}

async function createTestEventAsync(calendarId, customArgs = {}) {
  return await Calendar.createEventAsync(calendarId, {
    title: 'App.js Conference',
    startDate: +new Date(2019, 3, 4), // 4th April 2019, months are counted from 0
    endDate: +new Date(2019, 3, 5), // 5th April 2019
    timeZone: 'Europe/Warsaw',
    allDay: true,
    location: 'Qubus Hotel, Nadwiślańska 6, 30-527 Kraków, Poland',
    notes: 'The very first Expo & React Native conference in Europe',
    availability: Calendar.Availability.BUSY,
    ...customArgs,
  });
}

async function createTestAttendeeAsync(eventId) {
  return await Calendar.createAttendeeAsync(eventId, {
    name: 'Guest',
    email: 'guest@expo.io',
    role: Calendar.AttendeeRole.ATTENDEE,
    status: Calendar.AttendeeStatus.ACCEPTED,
    type: Calendar.AttendeeType.PERSON,
  });
}

async function getAttendeeByIdAsync(eventId, attendeeId) {
  const attendees = await Calendar.getAttendeesForEventAsync(eventId);
  return attendees.find(attendee => attendee.id === attendeeId);
}

async function createTestReminderAsync(calendarId) {
  return await Calendar.createReminderAsync(calendarId, {
    title: 'Reminder to buy a ticket',
    startDate: new Date(2019, 3, 3, 9, 0, 0),
    dueDate: new Date(2019, 3, 3, 23, 59, 59),
  });
}

async function getFirstCalendarForRemindersAsync() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
  return calendars[0] && calendars[0].id;
}

export async function test({
  beforeAll,
  afterAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  jasmine,
  expect,
  ...t
}) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? xdescribe : describe;

  function testCalendarShape(calendar) {
    expect(calendar).toBeDefined();
    expect(typeof calendar.id).toBe('string');
    expect(typeof calendar.title).toBe('string');
    expect(typeof calendar.source).toBe('object');
    testCalendarSourceShape(calendar.source);
    expect(typeof calendar.color).toBe('string');
    expect(typeof calendar.allowsModifications).toBe('boolean');

    expect(Array.isArray(calendar.allowedAvailabilities)).toBe(true);
    calendar.allowedAvailabilities.forEach(availability => {
      expect(Object.values(Calendar.Availability)).toContain(availability);
    });

    if (Platform.OS === 'ios') {
      expect(typeof calendar.entityType).toBe('string');
      expect(Object.values(Calendar.EntityTypes)).toContain(calendar.entityType);

      expect(typeof calendar.type).toBe('string');
      expect(Object.values(Calendar.CalendarType)).toContain(calendar.type);
    }
    if (Platform.OS === 'android') {
      expect(typeof calendar.isPrimary).toBe('boolean');
      expect(typeof calendar.name).toBe('string');
      expect(typeof calendar.ownerAccount).toBe('string');
      calendar.timeZone && expect(typeof calendar.timeZone).toBe('string');

      expect(Array.isArray(calendar.allowedReminders)).toBe(true);
      calendar.allowedReminders.forEach(reminder => {
        expect(Object.values(Calendar.AlarmMethod)).toContain(reminder);
      });

      expect(Array.isArray(calendar.allowedAttendeeTypes)).toBe(true);
      calendar.allowedAttendeeTypes.forEach(attendeeType => {
        expect(Object.values(Calendar.AttendeeType)).toContain(attendeeType);
      });

      expect(typeof calendar.isVisible).toBe('boolean');
      expect(typeof calendar.isSynced).toBe('boolean');
      expect(typeof calendar.accessLevel).toBe('string');
    }
  }

  function testEventShape(event) {
    expect(event).toBeDefined();
    expect(typeof event.id).toBe('string');
    expect(typeof event.calendarId).toBe('string');
    expect(typeof event.title).toBe('string');
    expect(typeof event.startDate).toBe('string');
    expect(typeof event.endDate).toBe('string');
    expect(typeof event.allDay).toBe('boolean');
    expect(typeof event.location).toBe('string');
    expect(typeof event.notes).toBe('string');
    expect(Array.isArray(event.alarms)).toBe(true);
    event.recurrenceRule && expect(typeof event.recurrenceRule).toBe('object');
    expect(Object.values(Calendar.Availability)).toContain(event.availability);
    event.timeZone && expect(typeof event.timeZone).toBe('string');

    if (Platform.OS === 'ios') {
      event.url && expect(typeof event.url).toBe('string');
      expect(typeof event.creationDate).toBe('string');
      expect(typeof event.lastModifiedDate).toBe('string');
      expect(typeof event.originalStartDate).toBe('string');
      expect(typeof event.isDetached).toBe('boolean');
      expect(Object.values(Calendar.EventStatus)).toContain(event.status);

      if (event.organizer) {
        expect(typeof event.organizer).toBe('object');
        testAttendeeShape(event.organizer);
      }
    }
    if (Platform.OS === 'android') {
      expect(typeof event.endTimeZone).toBe('string');
      expect(typeof event.organizerEmail).toBe('string');
      expect(Object.values(Calendar.EventAccessLevel)).toContain(event.accessLevel);
      expect(typeof event.guestsCanModify).toBe('boolean');
      expect(typeof event.guestsCanInviteOthers).toBe('boolean');
      expect(typeof event.guestsCanSeeGuests).toBe('boolean');
      event.originalId && expect(typeof event.originalId).toBe('string');
      event.instanceId && expect(typeof event.instanceId).toBe('string');
    }
  }

  function testCalendarSourceShape(source) {
    expect(source).toBeDefined();
    expect(typeof source.type).toBe('string');

    if (source.name !== null) {
      // source.name can be null if it refers to the local (unnamed) calendar.
      expect(typeof source.name).toBe('string');
    }

    if (Platform.OS === 'ios') {
      expect(typeof source.id).toBe('string');
    }
    if (Platform.OS === 'android') {
      expect(typeof source.isLocalAccount).toBe('boolean');
    }
  }

  function testAttendeeShape(attendee) {
    expect(attendee).toBeDefined();
    expect(typeof attendee.name).toBe('string');
    expect(typeof attendee.role).toBe('string');
    expect(Object.values(Calendar.AttendeeRole)).toContain(attendee.role);
    expect(typeof attendee.status).toBe('string');
    expect(Object.values(Calendar.AttendeeStatus)).toContain(attendee.status);
    expect(typeof attendee.type).toBe('string');
    expect(Object.values(Calendar.AttendeeType)).toContain(attendee.type);

    if (Platform.OS === 'ios') {
      expect(typeof attendee.url).toBe('string');
      expect(typeof attendee.isCurrentUser).toBe('boolean');
    }
    if (Platform.OS === 'android') {
      expect(typeof attendee.id).toBe('string');
      expect(typeof attendee.email).toBe('string');
    }
  }

  function testReminderShape(reminder) {
    expect(reminder).toBeDefined();
    expect(typeof reminder.id).toBe('string');
    expect(typeof reminder.calendarId).toBe('string');
    expect(typeof reminder.title).toBe('string');
    // expect(typeof reminder.startDate).toBe('string');
    // expect(typeof reminder.dueDate).toBe('string');
    expect(typeof reminder.completed).toBe('boolean');
  }

  function expectMethodsToReject(methods) {
    for (const methodName of methods) {
      describe(`${methodName}()`, () => {
        it('rejects with UnavailabilityError on unsupported platform', async () => {
          let error;
          try {
            await Calendar[methodName]();
          } catch (e) {
            error = e;
          }
          expect(error instanceof UnavailabilityError).toBe(true);
          expect(error.message).toBe(new UnavailabilityError('Calendar', methodName).message);
        });
      });
    }
  }

  describeWithPermissions('Calendar', () => {
    describe('requestCalendarPermissionsAsync()', () => {
      it('requests for Calendar permissions', async () => {
        const results = await Calendar.requestCalendarPermissionsAsync();

        expect(results.granted).toBe(true);
        expect(results.status).toBe('granted');
      });
    });

    describe('createCalendarAsync()', () => {
      let calendarId;

      it('creates a calendar', async () => {
        calendarId = await createTestCalendarAsync();
        const calendar = await getCalendarByIdAsync(calendarId);

        expect(calendarId).toBeDefined();
        expect(typeof calendarId).toBe('string');
        testCalendarShape(calendar);
      });

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('getCalendarsAsync()', () => {
      let calendarId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
      });

      it('returns an array of calendars with correct shape', async () => {
        const calendars = await Calendar.getCalendarsAsync();

        expect(Array.isArray(calendars)).toBeTruthy();

        for (const calendar of calendars) {
          testCalendarShape(calendar);
        }
      });

      if (Platform.OS === 'ios') {
        it('returns an array of calendars for reminders', async () => {
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);

          expect(Array.isArray(calendars)).toBeTruthy();

          for (const calendar of calendars) {
            expect(calendar.entityType).toBe(Calendar.EntityTypes.REMINDER);
          }
        });
      }

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('deleteCalendarAsync()', () => {
      it('deletes a calendar', async () => {
        const calendarId = await createTestCalendarAsync();
        await Calendar.deleteCalendarAsync(calendarId);

        const calendars = await Calendar.getCalendarsAsync();
        expect(calendars.findIndex(calendar => calendar.id === calendarId)).toBe(-1);
      });
    });

    describe('updateCalendarAsync()', () => {
      let calendarId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
      });

      it('updates a calendar', async () => {
        const newTitle = 'New test-suite calendar title';
        const updatedCalendarId = await Calendar.updateCalendarAsync(calendarId, {
          title: newTitle,
        });
        const updatedCalendar = await getCalendarByIdAsync(calendarId);

        expect(updatedCalendarId).toBe(calendarId);
        expect(updatedCalendar.title).toBe(newTitle);
      });

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('createEventAsync()', () => {
      let calendarId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
      });

      it('creates an event in the specific calendar', async () => {
        const eventId = await createTestEventAsync(calendarId);

        expect(eventId).toBeDefined();
        expect(typeof eventId).toBe('string');
      });

      if (Platform.OS === 'ios') {
        it('rejects when time zone is invalid', async () => {
          let error;
          try {
            await createTestEventAsync(calendarId, { timeZone: '' });
          } catch (e) {
            error = e;
          }
          expect(error).toBeDefined();
          expect(error.code).toBe('E_EVENT_INVALID_TIMEZONE');
        });
      }

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('getEventsAsync()', () => {
      let calendarId, eventId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      it('resolves to an array with an event of the correct shape', async () => {
        const events = await Calendar.getEventsAsync(
          [calendarId],
          +new Date(2019, 3, 1),
          +new Date(2019, 3, 29)
        );

        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBe(1);
        expect(events[0].id).toBe(eventId);
        testEventShape(events[0]);
      });

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('getEventAsync()', () => {
      let calendarId, eventId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      it('returns event with given id', async () => {
        const event = await Calendar.getEventAsync(eventId);

        expect(event).toBeDefined();
        expect(event.id).toBe(eventId);
        testEventShape(event);
      });

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('updateEventAsync()', () => {
      let calendarId, eventId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      it('updates an event', async () => {
        await Calendar.updateEventAsync(eventId, {
          availability: Calendar.Availability.FREE,
        });
        const updatedEvent = await Calendar.getEventAsync(eventId);

        expect(updatedEvent).toBeDefined();
        expect(updatedEvent.id).toBe(eventId);
        expect([Calendar.Availability.FREE, Calendar.Availability.NOT_SUPPORTED]).toContain(
          updatedEvent.availability
        );
      });

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    describe('deleteEventAsync()', () => {
      let calendarId, eventId;

      beforeAll(async () => {
        calendarId = await createTestCalendarAsync();
        eventId = await createTestEventAsync(calendarId);
      });

      it('deletes an event', async () => {
        await Calendar.deleteEventAsync(eventId);
        let error;

        try {
          await Calendar.getEventAsync(eventId);
        } catch (e) {
          error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        expect(error.code).toBe('E_EVENT_NOT_FOUND');
      });

      afterAll(async () => {
        await Calendar.deleteCalendarAsync(calendarId);
      });
    });

    if (Platform.OS === 'android') {
      describe('createAttendeeAsync()', () => {
        let calendarId, eventId;

        beforeAll(async () => {
          calendarId = await createTestCalendarAsync();
          eventId = await createTestEventAsync(calendarId);
        });

        it('creates an attendee', async () => {
          const attendeeId = await createTestAttendeeAsync(eventId);
          const attendees = await Calendar.getAttendeesForEventAsync(eventId);

          expect(Array.isArray(attendees)).toBe(true);

          const newAttendee = attendees.find(attendee => attendee.id === attendeeId);

          expect(newAttendee).toBeDefined();
          testAttendeeShape(newAttendee);
        });

        afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      describe('updateAttendeeAsync()', () => {
        let calendarId, eventId, attendeeId;

        beforeAll(async () => {
          calendarId = await createTestCalendarAsync();
          eventId = await createTestEventAsync(calendarId);
          attendeeId = await createTestAttendeeAsync(eventId);
        });

        it('updates attendee record', async () => {
          const updatedAttendeeId = await Calendar.updateAttendeeAsync(attendeeId, {
            role: Calendar.AttendeeRole.PERFORMER,
          });
          const updatedAttendee = await getAttendeeByIdAsync(eventId, attendeeId);

          expect(updatedAttendeeId).toBe(attendeeId);
          expect(updatedAttendee).toBeDefined();
          expect(updatedAttendee.role).toBe(Calendar.AttendeeRole.PERFORMER);
        });

        afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });

      describe('deleteAttendeeAsync()', () => {
        let calendarId, eventId;

        beforeAll(async () => {
          calendarId = await createTestCalendarAsync();
          eventId = await createTestEventAsync(calendarId);
        });

        it('deletes an attendee', async () => {
          const attendeeId = await createTestAttendeeAsync(eventId);
          await Calendar.deleteAttendeeAsync(attendeeId);

          const attendee = await getAttendeeByIdAsync(eventId, attendeeId);

          expect(attendee).toBeUndefined();
        });

        afterAll(async () => {
          await Calendar.deleteCalendarAsync(calendarId);
        });
      });
    } else {
      expectMethodsToReject(['createAttendeeAsync', 'updateAttendeeAsync', 'deleteAttendeeAsync']);
    }

    if (Platform.OS === 'ios') {
      describe('getDefaultCalendarAsync()', () => {
        it('get default calendar', async () => {
          const calendar = await Calendar.getDefaultCalendarAsync();

          testCalendarShape(calendar);
        });
      });

      describe('requestRemindersPermissionsAsync()', () => {
        it('requests for Reminders permissions', async () => {
          const results = await Calendar.requestRemindersPermissionsAsync();

          expect(results.granted).toBe(true);
          expect(results.status).toBe('granted');
        });
      });

      describe('createReminderAsync()', () => {
        let calendarId, reminderId;

        beforeAll(async () => {
          calendarId = await getFirstCalendarForRemindersAsync();
        });

        it('creates a reminder', async () => {
          reminderId = await createTestReminderAsync(calendarId);

          expect(reminderId).toBeDefined();
          expect(typeof reminderId).toBe('string');
        });

        afterAll(async () => {
          await Calendar.deleteReminderAsync(reminderId);
        });
      });

      describe('getRemindersAsync()', () => {
        let calendarId, reminderId;

        beforeAll(async () => {
          calendarId = await getFirstCalendarForRemindersAsync();
          reminderId = await createTestReminderAsync(calendarId);
        });

        it('returns an array of reminders', async () => {
          const reminders = await Calendar.getRemindersAsync(
            [calendarId],
            Calendar.ReminderStatus.INCOMPLETE,
            new Date(2019, 3, 2),
            new Date(2019, 3, 5)
          );

          expect(Array.isArray(reminders)).toBe(true);
          expect(reminders.length).toBe(1);
          expect(reminders[0].id).toBe(reminderId);
          testReminderShape(reminders[0]);
        });

        afterAll(async () => {
          await Calendar.deleteReminderAsync(reminderId);
        });
      });

      describe('getReminderAsync()', () => {
        let calendarId, reminderId;

        beforeAll(async () => {
          calendarId = await getFirstCalendarForRemindersAsync();
          reminderId = await createTestReminderAsync(calendarId);
        });

        it('returns an array of reminders', async () => {
          const reminder = await Calendar.getReminderAsync(reminderId);

          expect(reminder).toBeDefined();
          expect(reminder.id).toBe(reminderId);
          testReminderShape(reminder);
        });

        afterAll(async () => {
          await Calendar.deleteReminderAsync(reminderId);
        });
      });

      describe('updateReminderAsync()', () => {
        let calendarId, reminderId;

        beforeAll(async () => {
          calendarId = await getFirstCalendarForRemindersAsync();
          reminderId = await createTestReminderAsync(calendarId);
        });

        it('updates a reminder', async () => {
          const dueDate = new Date();
          dueDate.setMilliseconds(0);

          const updatedReminderId = await Calendar.updateReminderAsync(reminderId, { dueDate });
          const reminder = await Calendar.getReminderAsync(updatedReminderId);

          expect(updatedReminderId).toBe(reminderId);
          expect(reminder.dueDate).toBe(dueDate.toISOString());
        });

        afterAll(async () => {
          await Calendar.deleteReminderAsync(reminderId);
        });
      });

      describe('deleteReminderAsync()', () => {
        let calendarId, reminderId;

        beforeAll(async () => {
          calendarId = await getFirstCalendarForRemindersAsync();
          reminderId = await createTestReminderAsync(calendarId);
        });

        it('deletes a reminder', async () => {
          await Calendar.deleteReminderAsync(reminderId);
          let error;

          try {
            await Calendar.getReminderAsync(reminderId);
          } catch (e) {
            error = e;
          }
          expect(error).toBeDefined();
          expect(error instanceof Error).toBe(true);
          expect(error.code).toBe('E_REMINDER_NOT_FOUND');
        });

        afterAll(async () => {
          await Calendar.deleteReminderAsync(reminderId);
        });
      });

      describe('getSourcesAsync()', () => {
        it('returns an array of sources', async () => {
          const sources = await Calendar.getSourcesAsync();

          expect(Array.isArray(sources)).toBe(true);
        });
      });
    } else {
      expectMethodsToReject([
        'requestRemindersPermissionsAsync',
        'getRemindersAsync',
        'getReminderAsync',
        'createReminderAsync',
        'updateReminderAsync',
        'deleteReminderAsync',
        'getSourcesAsync',
      ]);
    }
  });
}
