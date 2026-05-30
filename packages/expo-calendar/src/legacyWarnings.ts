import type {
  Attendee,
  Calendar,
  CalendarDialogParams,
  DialogEventResult,
  Event,
  OpenEventDialogResult,
  OpenEventPresentationOptions,
  PresentationOptions,
  Reminder,
  Source,
  PermissionResponse,
  RecurringEventOptions,
  ReminderStatus,
} from './legacy/Calendar';

function errorOnLegacyMethodUse(methodName: string): Error {
  const message = `Method ${methodName} imported from "expo-calendar" is deprecated.\nImport the legacy API from "expo-calendar/legacy" or migrate to the new object-oriented API from "expo-calendar".\nAPI reference and migration examples are available in the calendar docs: https://docs.expo.dev/versions/latest/sdk/calendar/`;
  console.warn(message);
  return new Error(message);
}

/**
 * @deprecated Use `calendar.addEventWithForm()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createEventInCalendarAsync(
  eventData: Omit<Partial<Event>, 'id'> = {},
  presentationOptions?: PresentationOptions
): Promise<DialogEventResult> {
  throw errorOnLegacyMethodUse('createEventInCalendarAsync');
}

/**
 * @deprecated Use `event.openInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function openEventInCalendarAsync(
  params: CalendarDialogParams,
  presentationOptions?: OpenEventPresentationOptions
): Promise<OpenEventDialogResult> {
  throw errorOnLegacyMethodUse('openEventInCalendarAsync');
}

/**
 * @deprecated Use `event.editInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function editEventInCalendarAsync(
  params: CalendarDialogParams,
  presentationOptions?: PresentationOptions
): Promise<DialogEventResult> {
  throw errorOnLegacyMethodUse('editEventInCalendarAsync');
}

/**
 * @deprecated Import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function isAvailableAsync(): Promise<boolean> {
  throw errorOnLegacyMethodUse('isAvailableAsync');
}

/**
 * @deprecated Use `getCalendars()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getCalendarsAsync(entityType?: string): Promise<Calendar[]> {
  throw errorOnLegacyMethodUse('getCalendarsAsync');
}

/**
 * @deprecated Use `createCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createCalendarAsync(details: Partial<Calendar> = {}): Promise<string> {
  throw errorOnLegacyMethodUse('createCalendarAsync');
}

/**
 * @deprecated Use `calendar.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateCalendarAsync(
  id: string,
  details: Partial<Calendar> = {}
): Promise<string> {
  throw errorOnLegacyMethodUse('updateCalendarAsync');
}

/**
 * @deprecated Use `calendar.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteCalendarAsync(id: string): Promise<void> {
  throw errorOnLegacyMethodUse('deleteCalendarAsync');
}

/**
 * @deprecated Use `listEvents()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getEventsAsync(
  calendarIds: string[],
  startDate: Date | string,
  endDate: Date | string
): Promise<Event[]> {
  throw errorOnLegacyMethodUse('getEventsAsync');
}

/**
 * @deprecated Use `ExpoCalendarEvent.get()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getEventAsync(
  id: string,
  recurringEventOptions: RecurringEventOptions = {}
): Promise<Event> {
  throw errorOnLegacyMethodUse('getEventAsync');
}

/**
 * @deprecated Use `calendar.createEvent()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createEventAsync(
  calendarId: string,
  details: Partial<Event> = {}
): Promise<string> {
  throw errorOnLegacyMethodUse('createEventAsync');
}

/**
 * @deprecated Use `event.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateEventAsync(
  id: string,
  details: Partial<Event> = {},
  recurringEventOptions: RecurringEventOptions = {}
): Promise<string> {
  throw errorOnLegacyMethodUse('updateEventAsync');
}

/**
 * @deprecated Use `event.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteEventAsync(
  id: string,
  recurringEventOptions: RecurringEventOptions = {}
): Promise<void> {
  throw errorOnLegacyMethodUse('deleteEventAsync');
}

/**
 * @deprecated Use `event.getAttendees()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getAttendeesForEventAsync(id: string): Promise<Attendee[]> {
  throw errorOnLegacyMethodUse('getAttendeesForEventAsync');
}

/**
 * @deprecated Use `event.createAttendee()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createAttendeeAsync(eventId: string, details: Attendee): Promise<string> {
  throw errorOnLegacyMethodUse('createAttendeeAsync');
}

/**
 * @deprecated Use `attendee.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateAttendeeAsync(
  id: string,
  details: Partial<Attendee> = {}
): Promise<string> {
  throw errorOnLegacyMethodUse('updateAttendeeAsync');
}

/**
 * @deprecated Use `attendee.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteAttendeeAsync(id: string): Promise<void> {
  throw errorOnLegacyMethodUse('deleteAttendeeAsync');
}

/**
 * @deprecated Use `getDefaultCalendarSync()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getDefaultCalendarAsync(): Promise<Calendar> {
  throw errorOnLegacyMethodUse('getDefaultCalendarAsync');
}

/**
 * @deprecated Use `calendar.listReminders()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getRemindersAsync(
  calendarIds: string[],
  status: ReminderStatus,
  startDate?: Date | string,
  endDate?: Date | string
): Promise<Reminder[]> {
  throw errorOnLegacyMethodUse('getRemindersAsync');
}

/**
 * @deprecated Use `ExpoCalendarReminder.get()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getReminderAsync(id: string): Promise<Reminder> {
  throw errorOnLegacyMethodUse('getReminderAsync');
}

/**
 * @deprecated Use `calendar.createReminder()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createReminderAsync(
  calendarId: string,
  details: Reminder = {}
): Promise<string> {
  throw errorOnLegacyMethodUse('createReminderAsync');
}

/**
 * @deprecated Use `reminder.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateReminderAsync(id: string, details: Reminder = {}): Promise<string> {
  throw errorOnLegacyMethodUse('updateReminderAsync');
}

/**
 * @deprecated Use `reminder.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteReminderAsync(id: string): Promise<void> {
  throw errorOnLegacyMethodUse('deleteReminderAsync');
}

/**
 * @deprecated Use `getSourcesSync()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getSourcesAsync(): Promise<Source[]> {
  throw errorOnLegacyMethodUse('getSourcesAsync');
}

/**
 * @deprecated Import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getSourceAsync(id: string): Promise<Source> {
  throw errorOnLegacyMethodUse('getSourceAsync');
}

/**
 * @deprecated Use `event.openInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export function openEventInCalendar(id: string): void {
  throw errorOnLegacyMethodUse('openEventInCalendar');
}

/**
 * @deprecated Use `requestCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  throw errorOnLegacyMethodUse('requestPermissionsAsync');
}

/**
 * @deprecated Use `getCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getCalendarPermissionsAsync(): Promise<PermissionResponse> {
  throw errorOnLegacyMethodUse('getCalendarPermissionsAsync');
}

/**
 * @deprecated Use `getRemindersPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getRemindersPermissionsAsync(): Promise<PermissionResponse> {
  throw errorOnLegacyMethodUse('getRemindersPermissionsAsync');
}

/**
 * @deprecated Use `requestCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function requestCalendarPermissionsAsync(): Promise<PermissionResponse> {
  throw errorOnLegacyMethodUse('requestCalendarPermissionsAsync');
}

/**
 * @deprecated Use `requestRemindersPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function requestRemindersPermissionsAsync(): Promise<PermissionResponse> {
  throw errorOnLegacyMethodUse('requestRemindersPermissionsAsync');
}
