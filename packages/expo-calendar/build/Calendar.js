import { PermissionStatus, createPermissionHook, UnavailabilityError, } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';
import ExpoCalendar from './ExpoCalendar';
export var DayOfTheWeek;
(function (DayOfTheWeek) {
    DayOfTheWeek[DayOfTheWeek["Sunday"] = 1] = "Sunday";
    DayOfTheWeek[DayOfTheWeek["Monday"] = 2] = "Monday";
    DayOfTheWeek[DayOfTheWeek["Tuesday"] = 3] = "Tuesday";
    DayOfTheWeek[DayOfTheWeek["Wednesday"] = 4] = "Wednesday";
    DayOfTheWeek[DayOfTheWeek["Thursday"] = 5] = "Thursday";
    DayOfTheWeek[DayOfTheWeek["Friday"] = 6] = "Friday";
    DayOfTheWeek[DayOfTheWeek["Saturday"] = 7] = "Saturday";
})(DayOfTheWeek || (DayOfTheWeek = {}));
export var MonthOfTheYear;
(function (MonthOfTheYear) {
    MonthOfTheYear[MonthOfTheYear["January"] = 1] = "January";
    MonthOfTheYear[MonthOfTheYear["February"] = 2] = "February";
    MonthOfTheYear[MonthOfTheYear["March"] = 3] = "March";
    MonthOfTheYear[MonthOfTheYear["April"] = 4] = "April";
    MonthOfTheYear[MonthOfTheYear["May"] = 5] = "May";
    MonthOfTheYear[MonthOfTheYear["June"] = 6] = "June";
    MonthOfTheYear[MonthOfTheYear["July"] = 7] = "July";
    MonthOfTheYear[MonthOfTheYear["August"] = 8] = "August";
    MonthOfTheYear[MonthOfTheYear["September"] = 9] = "September";
    MonthOfTheYear[MonthOfTheYear["October"] = 10] = "October";
    MonthOfTheYear[MonthOfTheYear["November"] = 11] = "November";
    MonthOfTheYear[MonthOfTheYear["December"] = 12] = "December";
})(MonthOfTheYear || (MonthOfTheYear = {}));
export { PermissionStatus };
// @needsAudit
/**
 * Returns whether the Calendar API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the Calendar API is available on the current device.
 * Currently, this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync() {
    return !!ExpoCalendar.getCalendarsAsync;
}
// @needsAudit
/**
 * Gets an array of calendar objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific entity type. Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [calendar objects](#calendar 'Calendar') matching the provided entity type (if provided).
 */
export async function getCalendarsAsync(entityType) {
    if (!ExpoCalendar.getCalendarsAsync) {
        throw new UnavailabilityError('Calendar', 'getCalendarsAsync');
    }
    if (!entityType) {
        return ExpoCalendar.getCalendarsAsync(null);
    }
    return ExpoCalendar.getCalendarsAsync(entityType);
}
// @needsAudit
/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @return A string representing the ID of the newly created calendar.
 */
export async function createCalendarAsync(details = {}) {
    if (!ExpoCalendar.saveCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'createCalendarAsync');
    }
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color };
    return ExpoCalendar.saveCalendarAsync(newDetails);
}
// @needsAudit
/**
 * Updates the provided details of an existing calendar stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the calendar to update.
 * @param details A map of properties to be updated.
 */
export async function updateCalendarAsync(id, details = {}) {
    if (!ExpoCalendar.saveCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'updateCalendarAsync');
    }
    if (!id) {
        throw new Error('updateCalendarAsync must be called with an id (string) of the target calendar');
    }
    const color = details.color ? processColor(details.color) : undefined;
    if (Platform.OS === 'android') {
        if (details.hasOwnProperty('source') ||
            details.hasOwnProperty('color') ||
            details.hasOwnProperty('allowsModifications') ||
            details.hasOwnProperty('allowedAvailabilities') ||
            details.hasOwnProperty('isPrimary') ||
            details.hasOwnProperty('ownerAccount') ||
            details.hasOwnProperty('timeZone') ||
            details.hasOwnProperty('allowedReminders') ||
            details.hasOwnProperty('allowedAttendeeTypes') ||
            details.hasOwnProperty('accessLevel')) {
            console.warn('updateCalendarAsync was called with one or more read-only properties, which will not be updated');
        }
    }
    else {
        if (details.hasOwnProperty('source') ||
            details.hasOwnProperty('type') ||
            details.hasOwnProperty('entityType') ||
            details.hasOwnProperty('allowsModifications') ||
            details.hasOwnProperty('allowedAvailabilities')) {
            console.warn('updateCalendarAsync was called with one or more read-only properties, which will not be updated');
        }
    }
    const newDetails = { ...details, id, color };
    return ExpoCalendar.saveCalendarAsync(newDetails);
}
// @needsAudit
/**
 * Deletes an existing calendar and all associated events/reminders/attendees from the device. __Use with caution.__
 * @param id ID of the calendar to delete.
 */
export async function deleteCalendarAsync(id) {
    if (!ExpoCalendar.deleteCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'deleteCalendarAsync');
    }
    if (!id) {
        throw new Error('deleteCalendarAsync must be called with an id (string) of the target calendar');
    }
    return ExpoCalendar.deleteCalendarAsync(id);
}
// @needsAudit
/**
 * Returns all events in a given set of calendars over a specified time period. The filtering has
 * slightly different behavior per-platform - on iOS, all events that overlap at all with the
 * `[startDate, endDate]` interval are returned, whereas on Android, only events that begin on or
 * after the `startDate` and end on or before the `endDate` will be returned.
 * @param calendarIds Array of IDs of calendars to search for events in.
 * @param startDate Beginning of time period to search for events in.
 * @param endDate End of time period to search for events in.
 * @return A promise which fulfils with an array of [`Event`](#event) objects matching the search criteria.
 */
export async function getEventsAsync(calendarIds, startDate, endDate) {
    if (!ExpoCalendar.getEventsAsync) {
        throw new UnavailabilityError('Calendar', 'getEventsAsync');
    }
    if (!startDate) {
        throw new Error('getEventsAsync must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
        throw new Error('getEventsAsync must be called with an endDate (date) to search for events');
    }
    if (!calendarIds || !calendarIds.length) {
        throw new Error('getEventsAsync must be called with a non-empty array of calendarIds to search');
    }
    return ExpoCalendar.getEventsAsync(stringifyIfDate(startDate), stringifyIfDate(endDate), calendarIds);
}
// @needsAudit
/**
 * Returns a specific event selected by ID. If a specific instance of a recurring event is desired,
 * the start date of this instance must also be provided, as instances of recurring events do not
 * have their own unique and stable IDs on either iOS or Android.
 * @param id ID of the event to return.
 * @param recurringEventOptions A map of options for recurring events.
 * @return A promise which fulfils with an [`Event`](#event) object matching the provided criteria, if one exists.
 */
export async function getEventAsync(id, recurringEventOptions = {}) {
    if (!ExpoCalendar.getEventByIdAsync) {
        throw new UnavailabilityError('Calendar', 'getEventAsync');
    }
    if (!id) {
        throw new Error('getEventAsync must be called with an id (string) of the target event');
    }
    if (Platform.OS === 'ios') {
        return ExpoCalendar.getEventByIdAsync(id, recurringEventOptions.instanceStartDate);
    }
    else {
        return ExpoCalendar.getEventByIdAsync(id);
    }
}
// @needsAudit
/**
 * Creates a new event on the specified calendar.
 * @param calendarId ID of the calendar to create this event in.
 * @param eventData A map of details for the event to be created.
 * @return A promise which fulfils with a string representing the ID of the newly created event.
 */
export async function createEventAsync(calendarId, eventData = {}) {
    if (!ExpoCalendar.saveEventAsync) {
        throw new UnavailabilityError('Calendar', 'createEventAsync');
    }
    if (!calendarId) {
        throw new Error('createEventAsync must be called with an id (string) of the target calendar');
    }
    // @ts-expect-error id could be passed if user doesn't use TypeScript or doesn't use the method with an object litteral
    const { id, ...details } = eventData;
    if (id) {
        console.warn('You attempted to create an event with an id. Event ids are assigned by the system.');
    }
    if (Platform.OS === 'android') {
        if (!details.startDate) {
            throw new Error('createEventAsync requires a startDate (Date)');
        }
        if (!details.endDate) {
            throw new Error('createEventAsync requires an endDate (Date)');
        }
    }
    const newDetails = {
        ...details,
        calendarId,
    };
    return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), {});
}
// @needsAudit
/**
 * Updates the provided details of an existing calendar stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the event to be updated.
 * @param details A map of properties to be updated.
 * @param recurringEventOptions A map of options for recurring events.
 */
export async function updateEventAsync(id, details = {}, recurringEventOptions = {}) {
    if (!ExpoCalendar.saveEventAsync) {
        throw new UnavailabilityError('Calendar', 'updateEventAsync');
    }
    if (!id) {
        throw new Error('updateEventAsync must be called with an id (string) of the target event');
    }
    if (Platform.OS === 'ios') {
        if (details.hasOwnProperty('creationDate') ||
            details.hasOwnProperty('lastModifiedDate') ||
            details.hasOwnProperty('originalStartDate') ||
            details.hasOwnProperty('isDetached') ||
            details.hasOwnProperty('status') ||
            details.hasOwnProperty('organizer')) {
            console.warn('updateEventAsync was called with one or more read-only properties, which will not be updated');
        }
    }
    const { futureEvents = false, instanceStartDate } = recurringEventOptions;
    const newDetails = { ...details, id, instanceStartDate };
    return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), { futureEvents });
}
// @needsAudit
/**
 * Deletes an existing event from the device. Use with caution.
 * @param id ID of the event to be deleted.
 * @param recurringEventOptions A map of options for recurring events.
 */
export async function deleteEventAsync(id, recurringEventOptions = {}) {
    if (!ExpoCalendar.deleteEventAsync) {
        throw new UnavailabilityError('Calendar', 'deleteEventAsync');
    }
    if (!id) {
        throw new Error('deleteEventAsync must be called with an id (string) of the target event');
    }
    const { futureEvents = false, instanceStartDate } = recurringEventOptions;
    return ExpoCalendar.deleteEventAsync({ id, instanceStartDate }, { futureEvents });
}
// @needsAudit
/**
 * Gets all attendees for a given event (or instance of a recurring event).
 * @param id ID of the event to return attendees for.
 * @param recurringEventOptions A map of options for recurring events.
 * @return A promise which fulfils with an array of [`Attendee`](#attendee) associated with the
 * specified event.
 */
export async function getAttendeesForEventAsync(id, recurringEventOptions = {}) {
    if (!ExpoCalendar.getAttendeesForEventAsync) {
        throw new UnavailabilityError('Calendar', 'getAttendeesForEventAsync');
    }
    if (!id) {
        throw new Error('getAttendeesForEventAsync must be called with an id (string) of the target event');
    }
    const { instanceStartDate } = recurringEventOptions;
    // Android only takes an ID, iOS takes an object
    const params = Platform.OS === 'ios' ? { id, instanceStartDate } : id;
    return ExpoCalendar.getAttendeesForEventAsync(params);
}
// @needsAudit
/**
 * Creates a new attendee record and adds it to the specified event. Note that if `eventId` specifies
 * a recurring event, this will add the attendee to every instance of the event.
 * @param eventId ID of the event to add this attendee to.
 * @param details A map of details for the attendee to be created.
 * @return A string representing the ID of the newly created attendee record.
 * @platform android
 */
export async function createAttendeeAsync(eventId, details = {}) {
    if (!ExpoCalendar.saveAttendeeForEventAsync) {
        throw new UnavailabilityError('Calendar', 'createAttendeeAsync');
    }
    if (!eventId) {
        throw new Error('createAttendeeAsync must be called with an id (string) of the target event');
    }
    if (!details.email) {
        throw new Error('createAttendeeAsync requires an email (string)');
    }
    if (!details.role) {
        throw new Error('createAttendeeAsync requires a role (string)');
    }
    if (!details.type) {
        throw new Error('createAttendeeAsync requires a type (string)');
    }
    if (!details.status) {
        throw new Error('createAttendeeAsync requires a status (string)');
    }
    const newDetails = { ...details, id: undefined };
    return ExpoCalendar.saveAttendeeForEventAsync(newDetails, eventId);
}
// @needsAudit
/**
 * Updates an existing attendee record. To remove a property, explicitly set it to `null` in `details`.
 * @param id ID of the attendee record to be updated.
 * @param details A map of properties to be updated.
 * @platform android
 */
export async function updateAttendeeAsync(id, details = {}) {
    if (!ExpoCalendar.saveAttendeeForEventAsync) {
        throw new UnavailabilityError('Calendar', 'updateAttendeeAsync');
    }
    if (!id) {
        throw new Error('updateAttendeeAsync must be called with an id (string) of the target event');
    }
    const newDetails = { ...details, id };
    return ExpoCalendar.saveAttendeeForEventAsync(newDetails, null);
}
// @needsAudit
/**
 * Gets an instance of the default calendar object.
 * @return A promise resolving to the [Calendar](#calendar) object that is the user's default calendar.
 * @platform ios
 */
export async function getDefaultCalendarAsync() {
    if (!ExpoCalendar.getDefaultCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'getDefaultCalendarAsync');
    }
    return ExpoCalendar.getDefaultCalendarAsync();
}
// @needsAudit
/**
 * Deletes an existing attendee record from the device. __Use with caution.__
 * @param id ID of the attendee to delete.
 * @platform android
 */
export async function deleteAttendeeAsync(id) {
    if (!ExpoCalendar.deleteAttendeeAsync) {
        throw new UnavailabilityError('Calendar', 'deleteAttendeeAsync');
    }
    if (!id) {
        throw new Error('deleteAttendeeAsync must be called with an id (string) of the target event');
    }
    return ExpoCalendar.deleteAttendeeAsync(id);
}
// @needsAudit
/**
 * Returns a list of reminders matching the provided criteria. If `startDate` and `endDate` are defined,
 * returns all reminders that overlap at all with the [startDate, endDate] interval - i.e. all reminders
 * that end after the `startDate` or begin before the `endDate`.
 * @param calendarIds Array of IDs of calendars to search for reminders in.
 * @param status One of `Calendar.ReminderStatus.COMPLETED` or `Calendar.ReminderStatus.INCOMPLETE`.
 * @param startDate Beginning of time period to search for reminders in. Required if `status` is defined.
 * @param endDate End of time period to search for reminders in. Required if `status` is defined.
 * @return A promise which fulfils with an array of [`Reminder`](#reminder) objects matching the search criteria.
 * @platform ios
 */
export async function getRemindersAsync(calendarIds, status, startDate, endDate) {
    if (!ExpoCalendar.getRemindersAsync) {
        throw new UnavailabilityError('Calendar', 'getRemindersAsync');
    }
    if (status && !startDate) {
        throw new Error('getRemindersAsync must be called with a startDate (date) to search for reminders');
    }
    if (status && !endDate) {
        throw new Error('getRemindersAsync must be called with an endDate (date) to search for reminders');
    }
    if (!calendarIds || !calendarIds.length) {
        throw new Error('getRemindersAsync must be called with a non-empty array of calendarIds to search');
    }
    return ExpoCalendar.getRemindersAsync(stringifyIfDate(startDate) || null, stringifyIfDate(endDate) || null, calendarIds, status || null);
}
// @needsAudit
/**
 * Returns a specific reminder selected by ID.
 * @param id ID of the reminder to return.
 * @return A promise which fulfils with a [`Reminder`](#reminder) matching the provided ID, if one exists.
 * @platform ios
 */
export async function getReminderAsync(id) {
    if (!ExpoCalendar.getReminderByIdAsync) {
        throw new UnavailabilityError('Calendar', 'getReminderAsync');
    }
    if (!id) {
        throw new Error('getReminderAsync must be called with an id (string) of the target reminder');
    }
    return ExpoCalendar.getReminderByIdAsync(id);
}
// @needsAudit
/**
 * Creates a new reminder on the specified calendar.
 * @param calendarId ID of the calendar to create this reminder in (or `null` to add the calendar to
 * the OS-specified default calendar for reminders).
 * @param reminder A map of details for the reminder to be created
 * @return A promise which fulfils with a string representing the ID of the newly created reminder.
 * @platform ios
 */
export async function createReminderAsync(calendarId, reminder = {}) {
    if (!ExpoCalendar.saveReminderAsync) {
        throw new UnavailabilityError('Calendar', 'createReminderAsync');
    }
    const { id, ...details } = reminder;
    const newDetails = {
        ...details,
        calendarId: calendarId === null ? undefined : calendarId,
    };
    return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
}
// @needsAudit
/**
 * Updates the provided details of an existing reminder stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the reminder to be updated.
 * @param details A map of properties to be updated.
 * @platform ios
 */
export async function updateReminderAsync(id, details = {}) {
    if (!ExpoCalendar.saveReminderAsync) {
        throw new UnavailabilityError('Calendar', 'updateReminderAsync');
    }
    if (!id) {
        throw new Error('updateReminderAsync must be called with an id (string) of the target reminder');
    }
    if (details.hasOwnProperty('creationDate') || details.hasOwnProperty('lastModifiedDate')) {
        console.warn('updateReminderAsync was called with one or more read-only properties, which will not be updated');
    }
    const newDetails = { ...details, id };
    return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
}
// @needsAudit
/**
 * Deletes an existing reminder from the device. __Use with caution.__
 * @param id ID of the reminder to be deleted.
 * @platform ios
 */
export async function deleteReminderAsync(id) {
    if (!ExpoCalendar.deleteReminderAsync) {
        throw new UnavailabilityError('Calendar', 'deleteReminderAsync');
    }
    if (!id) {
        throw new Error('deleteReminderAsync must be called with an id (string) of the target reminder');
    }
    return ExpoCalendar.deleteReminderAsync(id);
}
// @needsAudit @docsMissing
/**
 * @return A promise which fulfils with an array of [`Source`](#source) objects all sources for
 * calendars stored on the device.
 * @platform ios
 */
export async function getSourcesAsync() {
    if (!ExpoCalendar.getSourcesAsync) {
        throw new UnavailabilityError('Calendar', 'getSourcesAsync');
    }
    return ExpoCalendar.getSourcesAsync();
}
// @needsAudit
/**
 * Returns a specific source selected by ID.
 * @param id ID of the source to return.
 * @return A promise which fulfils with an array of [`Source`](#source) object matching the provided
 * ID, if one exists.
 * @platform ios
 */
export async function getSourceAsync(id) {
    if (!ExpoCalendar.getSourceByIdAsync) {
        throw new UnavailabilityError('Calendar', 'getSourceAsync');
    }
    if (!id) {
        throw new Error('getSourceAsync must be called with an id (string) of the target source');
    }
    return ExpoCalendar.getSourceByIdAsync(id);
}
// @needsAudit
/**
 * Sends an intent to open the specified event in the OS Calendar app.
 * @param id ID of the event to open.
 * @platform android
 */
export function openEventInCalendar(id) {
    if (!ExpoCalendar.openEventInCalendar) {
        console.warn(`openEventInCalendar is not available on platform: ${Platform.OS}`);
        return;
    }
    if (!id) {
        throw new Error('openEventInCalendar must be called with an id (string) of the target event');
    }
    return ExpoCalendar.openEventInCalendar(parseInt(id, 10));
} // Android
// @needsAudit
/**
 * @deprecated Use [`requestCalendarPermissionsAsync()`](#calendarrequestcalendarpermissionsasync) instead.
 */
export async function requestPermissionsAsync() {
    console.warn('requestPermissionsAsync is deprecated. Use requestCalendarPermissionsAsync instead.');
    return requestCalendarPermissionsAsync();
}
// @needsAudit
/**
 * Checks user's permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function getCalendarPermissionsAsync() {
    if (!ExpoCalendar.getCalendarPermissionsAsync) {
        throw new UnavailabilityError('Calendar', 'getCalendarPermissionsAsync');
    }
    return ExpoCalendar.getCalendarPermissionsAsync();
}
// @needsAudit
/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export async function getRemindersPermissionsAsync() {
    if (!ExpoCalendar.getRemindersPermissionsAsync) {
        throw new UnavailabilityError('Calendar', 'getRemindersPermissionsAsync');
    }
    return ExpoCalendar.getRemindersPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function requestCalendarPermissionsAsync() {
    if (!ExpoCalendar.requestCalendarPermissionsAsync) {
        throw new UnavailabilityError('Calendar', 'requestCalendarPermissionsAsync');
    }
    return await ExpoCalendar.requestCalendarPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export async function requestRemindersPermissionsAsync() {
    if (!ExpoCalendar.requestRemindersPermissionsAsync) {
        throw new UnavailabilityError('Calendar', 'requestRemindersPermissionsAsync');
    }
    return await ExpoCalendar.requestRemindersPermissionsAsync();
}
// @needsAudit
/**
 * Check or request permissions to access the calendar.
 * This uses both `getCalendarPermissionsAsync` and `requestCalendarPermissionsAsync` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useCalendarPermissions();
 * ```
 */
export const useCalendarPermissions = createPermissionHook({
    getMethod: getCalendarPermissionsAsync,
    requestMethod: requestCalendarPermissionsAsync,
});
// @needsAudit
/**
 * Check or request permissions to access reminders.
 * This uses both `getRemindersPermissionsAsync` and `requestRemindersPermissionsAsync` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useRemindersPermissions();
 * ```
 */
export const useRemindersPermissions = createPermissionHook({
    getMethod: getRemindersPermissionsAsync,
    requestMethod: requestRemindersPermissionsAsync,
});
export var EntityTypes;
(function (EntityTypes) {
    EntityTypes["EVENT"] = "event";
    EntityTypes["REMINDER"] = "reminder";
})(EntityTypes || (EntityTypes = {}));
export var Frequency;
(function (Frequency) {
    Frequency["DAILY"] = "daily";
    Frequency["WEEKLY"] = "weekly";
    Frequency["MONTHLY"] = "monthly";
    Frequency["YEARLY"] = "yearly";
})(Frequency || (Frequency = {}));
export var Availability;
(function (Availability) {
    Availability["NOT_SUPPORTED"] = "notSupported";
    Availability["BUSY"] = "busy";
    Availability["FREE"] = "free";
    Availability["TENTATIVE"] = "tentative";
    Availability["UNAVAILABLE"] = "unavailable";
})(Availability || (Availability = {}));
export var CalendarType;
(function (CalendarType) {
    CalendarType["LOCAL"] = "local";
    CalendarType["CALDAV"] = "caldav";
    CalendarType["EXCHANGE"] = "exchange";
    CalendarType["SUBSCRIBED"] = "subscribed";
    CalendarType["BIRTHDAYS"] = "birthdays";
    CalendarType["UNKNOWN"] = "unknown";
})(CalendarType || (CalendarType = {})); // iOS
export var EventStatus;
(function (EventStatus) {
    EventStatus["NONE"] = "none";
    EventStatus["CONFIRMED"] = "confirmed";
    EventStatus["TENTATIVE"] = "tentative";
    EventStatus["CANCELED"] = "canceled";
})(EventStatus || (EventStatus = {}));
export var SourceType;
(function (SourceType) {
    SourceType["LOCAL"] = "local";
    SourceType["EXCHANGE"] = "exchange";
    SourceType["CALDAV"] = "caldav";
    SourceType["MOBILEME"] = "mobileme";
    SourceType["SUBSCRIBED"] = "subscribed";
    SourceType["BIRTHDAYS"] = "birthdays";
})(SourceType || (SourceType = {}));
export var AttendeeRole;
(function (AttendeeRole) {
    AttendeeRole["UNKNOWN"] = "unknown";
    AttendeeRole["REQUIRED"] = "required";
    AttendeeRole["OPTIONAL"] = "optional";
    AttendeeRole["CHAIR"] = "chair";
    AttendeeRole["NON_PARTICIPANT"] = "nonParticipant";
    AttendeeRole["ATTENDEE"] = "attendee";
    AttendeeRole["ORGANIZER"] = "organizer";
    AttendeeRole["PERFORMER"] = "performer";
    AttendeeRole["SPEAKER"] = "speaker";
    AttendeeRole["NONE"] = "none";
})(AttendeeRole || (AttendeeRole = {}));
export var AttendeeStatus;
(function (AttendeeStatus) {
    AttendeeStatus["UNKNOWN"] = "unknown";
    AttendeeStatus["PENDING"] = "pending";
    AttendeeStatus["ACCEPTED"] = "accepted";
    AttendeeStatus["DECLINED"] = "declined";
    AttendeeStatus["TENTATIVE"] = "tentative";
    AttendeeStatus["DELEGATED"] = "delegated";
    AttendeeStatus["COMPLETED"] = "completed";
    AttendeeStatus["IN_PROCESS"] = "inProcess";
    AttendeeStatus["INVITED"] = "invited";
    AttendeeStatus["NONE"] = "none";
})(AttendeeStatus || (AttendeeStatus = {}));
export var AttendeeType;
(function (AttendeeType) {
    AttendeeType["UNKNOWN"] = "unknown";
    AttendeeType["PERSON"] = "person";
    AttendeeType["ROOM"] = "room";
    AttendeeType["GROUP"] = "group";
    AttendeeType["RESOURCE"] = "resource";
    AttendeeType["OPTIONAL"] = "optional";
    AttendeeType["REQUIRED"] = "required";
    AttendeeType["NONE"] = "none";
})(AttendeeType || (AttendeeType = {}));
export var AlarmMethod;
(function (AlarmMethod) {
    AlarmMethod["ALARM"] = "alarm";
    AlarmMethod["ALERT"] = "alert";
    AlarmMethod["EMAIL"] = "email";
    AlarmMethod["SMS"] = "sms";
    AlarmMethod["DEFAULT"] = "default";
})(AlarmMethod || (AlarmMethod = {}));
export var EventAccessLevel;
(function (EventAccessLevel) {
    EventAccessLevel["CONFIDENTIAL"] = "confidential";
    EventAccessLevel["PRIVATE"] = "private";
    EventAccessLevel["PUBLIC"] = "public";
    EventAccessLevel["DEFAULT"] = "default";
})(EventAccessLevel || (EventAccessLevel = {}));
export var CalendarAccessLevel;
(function (CalendarAccessLevel) {
    CalendarAccessLevel["CONTRIBUTOR"] = "contributor";
    CalendarAccessLevel["EDITOR"] = "editor";
    CalendarAccessLevel["FREEBUSY"] = "freebusy";
    CalendarAccessLevel["OVERRIDE"] = "override";
    CalendarAccessLevel["OWNER"] = "owner";
    CalendarAccessLevel["READ"] = "read";
    CalendarAccessLevel["RESPOND"] = "respond";
    CalendarAccessLevel["ROOT"] = "root";
    CalendarAccessLevel["NONE"] = "none";
})(CalendarAccessLevel || (CalendarAccessLevel = {}));
export var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["COMPLETED"] = "completed";
    ReminderStatus["INCOMPLETE"] = "incomplete";
})(ReminderStatus || (ReminderStatus = {}));
function stringifyIfDate(date) {
    return date instanceof Date ? date.toISOString() : date;
}
function stringifyDateValues(obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (value != null && typeof value === 'object' && !(value instanceof Date)) {
            if (Array.isArray(value)) {
                return { ...acc, [key]: value.map(stringifyDateValues) };
            }
            return { ...acc, [key]: stringifyDateValues(value) };
        }
        acc[key] = stringifyIfDate(value);
        return acc;
    }, {});
}
//# sourceMappingURL=Calendar.js.map