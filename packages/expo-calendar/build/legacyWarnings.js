function errorOnLegacyMethodUse(methodName) {
    const message = `Method ${methodName} imported from "expo-calendar" is deprecated.\nImport the legacy API from "expo-calendar/legacy" or migrate to the new object-oriented API from "expo-calendar".\nAPI reference and migration examples are available in the calendar docs: https://docs.expo.dev/versions/latest/sdk/calendar/`;
    console.warn(message);
    return new Error(message);
}
/**
 * @deprecated Use `calendar.addEventWithForm()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createEventInCalendarAsync(eventData = {}, presentationOptions) {
    throw errorOnLegacyMethodUse('createEventInCalendarAsync');
}
/**
 * @deprecated Use `event.openInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function openEventInCalendarAsync(params, presentationOptions) {
    throw errorOnLegacyMethodUse('openEventInCalendarAsync');
}
/**
 * @deprecated Use `event.editInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function editEventInCalendarAsync(params, presentationOptions) {
    throw errorOnLegacyMethodUse('editEventInCalendarAsync');
}
/**
 * @deprecated Import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function isAvailableAsync() {
    throw errorOnLegacyMethodUse('isAvailableAsync');
}
/**
 * @deprecated Use `getCalendars()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getCalendarsAsync(entityType) {
    throw errorOnLegacyMethodUse('getCalendarsAsync');
}
/**
 * @deprecated Use `createCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createCalendarAsync(details = {}) {
    throw errorOnLegacyMethodUse('createCalendarAsync');
}
/**
 * @deprecated Use `calendar.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateCalendarAsync(id, details = {}) {
    throw errorOnLegacyMethodUse('updateCalendarAsync');
}
/**
 * @deprecated Use `calendar.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteCalendarAsync(id) {
    throw errorOnLegacyMethodUse('deleteCalendarAsync');
}
/**
 * @deprecated Use `listEvents()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getEventsAsync(calendarIds, startDate, endDate) {
    throw errorOnLegacyMethodUse('getEventsAsync');
}
/**
 * @deprecated Use `ExpoCalendarEvent.get()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getEventAsync(id, recurringEventOptions = {}) {
    throw errorOnLegacyMethodUse('getEventAsync');
}
/**
 * @deprecated Use `calendar.createEvent()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createEventAsync(calendarId, details = {}) {
    throw errorOnLegacyMethodUse('createEventAsync');
}
/**
 * @deprecated Use `event.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateEventAsync(id, details = {}, recurringEventOptions = {}) {
    throw errorOnLegacyMethodUse('updateEventAsync');
}
/**
 * @deprecated Use `event.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteEventAsync(id, recurringEventOptions = {}) {
    throw errorOnLegacyMethodUse('deleteEventAsync');
}
/**
 * @deprecated Use `event.getAttendees()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getAttendeesForEventAsync(id) {
    throw errorOnLegacyMethodUse('getAttendeesForEventAsync');
}
/**
 * @deprecated Use `event.createAttendee()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createAttendeeAsync(eventId, details) {
    throw errorOnLegacyMethodUse('createAttendeeAsync');
}
/**
 * @deprecated Use `attendee.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateAttendeeAsync(id, details = {}) {
    throw errorOnLegacyMethodUse('updateAttendeeAsync');
}
/**
 * @deprecated Use `attendee.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteAttendeeAsync(id) {
    throw errorOnLegacyMethodUse('deleteAttendeeAsync');
}
/**
 * @deprecated Use `getDefaultCalendarSync()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getDefaultCalendarAsync() {
    throw errorOnLegacyMethodUse('getDefaultCalendarAsync');
}
/**
 * @deprecated Use `calendar.listReminders()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getRemindersAsync(calendarIds, status, startDate, endDate) {
    throw errorOnLegacyMethodUse('getRemindersAsync');
}
/**
 * @deprecated Use `ExpoCalendarReminder.get()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getReminderAsync(id) {
    throw errorOnLegacyMethodUse('getReminderAsync');
}
/**
 * @deprecated Use `calendar.createReminder()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function createReminderAsync(calendarId, details = {}) {
    throw errorOnLegacyMethodUse('createReminderAsync');
}
/**
 * @deprecated Use `reminder.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function updateReminderAsync(id, details = {}) {
    throw errorOnLegacyMethodUse('updateReminderAsync');
}
/**
 * @deprecated Use `reminder.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function deleteReminderAsync(id) {
    throw errorOnLegacyMethodUse('deleteReminderAsync');
}
/**
 * @deprecated Use `getSourcesSync()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getSourcesAsync() {
    throw errorOnLegacyMethodUse('getSourcesAsync');
}
/**
 * @deprecated Import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getSourceAsync(id) {
    throw errorOnLegacyMethodUse('getSourceAsync');
}
/**
 * @deprecated Use `event.openInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export function openEventInCalendar(id) {
    throw errorOnLegacyMethodUse('openEventInCalendar');
}
/**
 * @deprecated Use `requestCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function requestPermissionsAsync() {
    throw errorOnLegacyMethodUse('requestPermissionsAsync');
}
/**
 * @deprecated Use `getCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getCalendarPermissionsAsync() {
    throw errorOnLegacyMethodUse('getCalendarPermissionsAsync');
}
/**
 * @deprecated Use `getRemindersPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function getRemindersPermissionsAsync() {
    throw errorOnLegacyMethodUse('getRemindersPermissionsAsync');
}
/**
 * @deprecated Use `requestCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function requestCalendarPermissionsAsync() {
    throw errorOnLegacyMethodUse('requestCalendarPermissionsAsync');
}
/**
 * @deprecated Use `requestRemindersPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export async function requestRemindersPermissionsAsync() {
    throw errorOnLegacyMethodUse('requestRemindersPermissionsAsync');
}
//# sourceMappingURL=legacyWarnings.js.map