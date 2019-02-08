---
title: Calendar
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Provides an API for interacting with the device's system calendars, events, reminders, and associated records.

Requires `Permissions.CALENDAR`. Interacting with reminders on iOS requires `Permissions.REMINDERS`.

See the bottom of this page for a complete list of all possible fields for the objects used in this API.

### `Expo.Calendar.getCalendarsAsync(entityType)`

Gets an array of calendar objects with details about the different calendars stored on the device.

#### Arguments

-   **entityType : `string`** -- (iOS only) Not required, but if defined, filters the returned calendars to a specific entity type. Possible values are `Expo.Calendar.EntityTypes.EVENT` (for calendars shown in the Calendar app) and `Expo.Calendar.EntityTypes.REMINDER` (for the Reminders app).

#### Returns

An array of [calendar objects](#calendar "Calendar") matching the provided entity type (if provided).

### `Expo.Calendar.createCalendarAsync(details)`

Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.

#### Arguments

-   **details : `object`** --

      A map of details for the calendar to be created (see below for a description of these fields):

    -   **title : `string`** -- Required
    -   **color : `string`** -- Required
    -   **entityType : `string`** -- Required (iOS only)
    -   **sourceId : `string`** -- Required (iOS only). ID of the source to be used for the calendar. Likely the same as the source for any other locally stored calendars.
    -   **source : `object`** -- Required (Android only). Object representing the source to be used for the calendar.

        -   **isLocalAccount : `boolean`** -- Whether this source is the local phone account. Must be `true` if `type` is undefined.
        -   **name : `string`** -- Required. Name for the account that owns this calendar and was used to sync the calendar to the device.
        -   **type : `string`** -- Type of the account that owns this calendar and was used to sync it to the device. If `isLocalAccount` is falsy then this must be defined, and must match an account on the device along with `name`, or the OS will delete the calendar.

    -   **name : `string`** -- Required (Android only)
    -   **ownerAccount : `string`** -- Required (Android only)
    -   **timeZone : `string`** -- (Android only)
    -   **allowedAvailabilities : `array`** -- (Android only)
    -   **allowedReminders : `array`** -- (Android only)
    -   **allowedAttendeeTypes : `array`** -- (Android only)
    -   **isVisible : `boolean`** -- (Android only)
    -   **isSynced : `boolean`** -- (Android only)
    -   **accessLevel : `string`** -- (Android only)

#### Returns

A string representing the ID of the newly created calendar.

### `Expo.Calendar.updateCalendarAsync(id, details)`

Updates the provided details of an existing calendar stored on the device. To remove a property, explicitly set it to `null` in `details`.

#### Arguments

-   **id : `string`** -- ID of the calendar to update. Required.
-   **details : `object`** --

      A map of properties to be updated (see below for a description of these fields):

    -   **title : `string`**
    -   **sourceId : `string`** -- (iOS only)
    -   **color : `string`** -- (iOS only)
    -   **name : `string`** -- (Android only)
    -   **isVisible : `boolean`** -- (Android only)
    -   **isSynced : `boolean`** -- (Android only)

### `Expo.Calendar.deleteCalendarAsync(id)`

Deletes an existing calendar and all associated events/reminders/attendees from the device. Use with caution.

#### Arguments

-   **id : `string`** -- ID of the calendar to delete.

### `Expo.Calendar.getEventsAsync(calendarIds, startDate, endDate)`

Returns all events in a given set of calendars over a specified time period. The filtering has slightly different behavior per-platform -- on iOS, all events that overlap at all with the `[startDate, endDate]` interval are returned, whereas on Android, only events that begin on or after the `startDate` and end on or before the `endDate` will be returned.

#### Arguments

-   **calendarIds : `array`** -- Array of IDs of calendars to search for events in. Required.
-   **startDate : `Date`** -- Beginning of time period to search for events in. Required.
-   **endDate : `Date`** -- End of time period to search for events in. Required.

#### Returns

An array of [event objects](#event "Event") matching the search criteria.

### `Expo.Calendar.getEventAsync(id, recurringEventOptions)`

Returns a specific event selected by ID. If a specific instance of a recurring event is desired, the start date of this instance must also be provided, as instances of recurring events do not have their own unique and stable IDs on either iOS or Android.

#### Arguments

-   **id : `string`** -- ID of the event to return. Required.
-   **recurringEventOptions : `object`** --

      A map of options for recurring events:

    -   **instanceStartDate : `Date`** -- Date object representing the start time of the desired instance, if looking for a single instance of a recurring event. If this is not provided and **id** represents a recurring event, the first instance of that event will be returned by default.

#### Returns

An [event object](#event "Event") matching the provided criteria, if one exists.

### `Expo.Calendar.createEventAsync(calendarId, details)`

Creates a new event on the specified calendar.

#### Arguments

-   **calendarId : `string`** -- ID of the calendar to create this event in (or `Expo.Calendar.DEFAULT` to add the calendar to the OS-specified default calendar for events). Required.
-   **details : `object`** --

      A map of details for the event to be created (see below for a description of these fields):

    -   **title : `string`**
    -   **startDate : `Date`** -- Required.
    -   **endDate : `Date`** -- Required on Android.
    -   **allDay : `boolean`**
    -   **location : `string`**
    -   **notes : `string`**
    -   **alarms : `Array<Alarm>`**
    -   **recurrenceRule : `RecurrenceRule`**
    -   **availability : `string`**
    -   **timeZone : `string`** -- Required on Android.
    -   **endTimeZone : `string`** -- (Android only)
    -   **url : `string`** -- (iOS only)
    -   **organizerEmail : `string`** -- (Android only)
    -   **accessLevel : `string`** -- (Android only)
    -   **guestsCanModify : `boolean`** -- (Android only)
    -   **guestsCanInviteOthers : `boolean`** -- (Android only)
    -   **guestsCanSeeGuests : `boolean`** -- (Android only)

#### Returns

A string representing the ID of the newly created event.

### `Expo.Calendar.updateEventAsync(id, details, recurringEventOptions)`

Updates the provided details of an existing calendar stored on the device. To remove a property, explicitly set it to `null` in `details`.

#### Arguments

-   **id : `string`** -- ID of the event to be updated. Required.
-   **details : `object`** --

      A map of properties to be updated (see below for a description of these fields):

    -   **title : `string`**
    -   **startDate : `Date`**
    -   **endDate : `Date`**
    -   **allDay : `boolean`**
    -   **location : `string`**
    -   **notes : `string`**
    -   **alarms : `Array<Alarm>`**
    -   **recurrenceRule : `RecurrenceRule`**
    -   **availability : `string`**
    -   **timeZone : `string`**
    -   **endTimeZone : `string`** -- (Android only)
    -   **url : `string`** -- (iOS only)
    -   **organizerEmail : `string`** -- (Android only)
    -   **accessLevel : `string`** -- (Android only)
    -   **guestsCanModify : `boolean`** -- (Android only)
    -   **guestsCanInviteOthers : `boolean`** -- (Android only)
    -   **guestsCanSeeGuests : `boolean`** -- (Android only)

-   **recurringEventOptions : `object`** --

      A map of options for recurring events:

    -   **instanceStartDate : `Date`** -- Date object representing the start time of the desired instance, if wanting to update a single instance of a recurring event. If this is not provided and **id** represents a recurring event, the first instance of that event will be updated by default.
    -   **futureEvents : `boolean`** -- Whether or not future events in the recurring series should also be updated. If `true`, will apply the given changes to the recurring instance specified by `instanceStartDate` and all future events in the series. If `false`, will only apply the given changes to the instance specified by `instanceStartDate`.

### `Expo.Calendar.deleteEventAsync(id, recurringEventOptions)`

Deletes an existing event from the device. Use with caution.

#### Arguments

-   **id : `string`** -- ID of the event to be deleted. Required.
-   **recurringEventOptions : `object`** --

      A map of options for recurring events:

    -   **instanceStartDate : `Date`** -- Date object representing the start time of the desired instance, if wanting to delete a single instance of a recurring event. If this is not provided and **id** represents a recurring event, the first instance of that event will be deleted by default.
    -   **futureEvents : `boolean`** -- Whether or not future events in the recurring series should also be deleted. If `true`, will delete the instance specified by `instanceStartDate` and all future events in the series. If `false`, will only delete the instance specified by `instanceStartDate`.


### `Expo.Calendar.getAttendeesForEventAsync(eventId, recurringEventOptions)`

Gets all attendees for a given event (or instance of a recurring event).

#### Arguments

-   **eventId : `string`** -- ID of the event to return attendees for. Required.
-   **recurringEventOptions : `object`** --

      A map of options for recurring events:

    -   **instanceStartDate : `Date`** -- Date object representing the start time of the desired instance, if looking for a single instance of a recurring event. If this is not provided and **eventId** represents a recurring event, the attendees of the first instance of that event will be returned by default.

#### Returns

An array of [attendee objects](#attendee "Attendee") associated with the specified event.

### `Expo.Calendar.createAttendeeAsync(eventId, details)`

**Available on Android only.** Creates a new attendee record and adds it to the specified event. Note that if `eventId` specifies a recurring event, this will add the attendee to every instance of the event.

#### Arguments

-   **eventId : `string`** -- ID of the event to add this attendee to. Required.
-   **details : `object`** --

      A map of details for the attendee to be created (see below for a description of these fields):

    -   **id : `string`** Required.
    -   **email : `string`** Required.
    -   **name : `string`**
    -   **role : `string`** Required.
    -   **status : `string`** Required.
    -   **type : `string`** Required.

#### Returns

A string representing the ID of the newly created attendee record.

### `Expo.Calendar.updateAttendeeAsync(id, details)`

**Available on Android only.** Updates an existing attendee record. To remove a property, explicitly set it to `null` in `details`.

#### Arguments

-   **id : `string`** -- ID of the attendee record to be updated. Required.
-   **details : `object`** --

      A map of properties to be updated (see below for a description of these fields):

    -   **id : `string`**
    -   **email : `string`**
    -   **name : `string`**
    -   **role : `string`**
    -   **status : `string`**
    -   **type : `string`**

### `Expo.Calendar.deleteAttendeeAsync(id)`

**Available on Android only.** Deletes an existing attendee record from the device. Use with caution.

#### Arguments

-   **id : `string`** -- ID of the attendee to delete.

### `Expo.Calendar.getRemindersAsync(calendarIds, status, startDate, endDate)`

**Available on iOS only.** Returns a list of reminders matching the provided criteria. If `startDate` and `endDate` are defined, returns all reminders that overlap at all with the [startDate, endDate] interval -- i.e. all reminders that end after the `startDate` or begin before the `endDate`.

#### Arguments

-   **calendarIds : `array`** -- Array of IDs of calendars to search for reminders in. Required.
-   **status : `string`** -- One of `Calendar.ReminderStatus.COMPLETED` or `Calendar.ReminderStatus.INCOMPLETE`.
-   **startDate : `Date`** -- Beginning of time period to search for reminders in. Required if `status` is defined.
-   **endDate : `Date`** -- End of time period to search for reminders in. Required if `status` is defined.

#### Returns

An array of [reminder objects](#reminder "Reminder") matching the search criteria.

### `Expo.Calendar.getReminderAsync(id)`

**Available on iOS only.** Returns a specific reminder selected by ID.

#### Arguments

-   **id : `string`** -- ID of the reminder to return. Required.

#### Returns

An [reminder object](#reminder "Reminder") matching the provided ID, if one exists.

### `Expo.Calendar.createReminderAsync(calendarId, details)`

**Available on iOS only.** Creates a new reminder on the specified calendar.

#### Arguments

-   **calendarId : `string`** -- ID of the calendar to create this reminder in (or `Expo.Calendar.DEFAULT` to add the calendar to the OS-specified default calendar for reminders). Required.
-   **details : `object`** --

      A map of details for the reminder to be created: (see below for a description of these fields)

    -   **title : `string`**
    -   **startDate : `Date`**
    -   **dueDate : `Date`**
    -   **completed : `boolean`**
    -   **completionDate : `Date`**
    -   **location : `string`**
    -   **notes : `string`**
    -   **alarms : `array`**
    -   **recurrenceRule : `RecurrenceRule`**
    -   **timeZone : `string`**
    -   **url : `string`**

#### Returns

A string representing the ID of the newly created reminder.

### `Expo.Calendar.updateReminderAsync(id, details)`

**Available on iOS only.** Updates the provided details of an existing reminder stored on the device. To remove a property, explicitly set it to `null` in `details`.

#### Arguments

-   **id : `string`** -- ID of the reminder to be updated. Required.
-   **details : `object`** --

      A map of properties to be updated (see below for a description of these fields):

    -   **title : `string`**
    -   **startDate : `Date`**
    -   **dueDate : `Date`**
    -   **completionDate : `Date`** -- Setting this property of a nonnull Date will automatically set the reminder's `completed` value to `true`.
    -   **location : `string`**
    -   **notes : `string`**
    -   **alarms : `array`**
    -   **recurrenceRule : `RecurrenceRule`**
    -   **timeZone : `string`**
    -   **url : `string`**

### `Expo.Calendar.deleteReminderAsync(id)`

**Available on iOS only.** Deletes an existing reminder from the device. Use with caution.

#### Arguments

-   **id : `string`** -- ID of the reminder to be deleted. Required.

### `Expo.Calendar.getSourcesAsync()`

**Available on iOS only.**

#### Returns

An array of [source objects](#source "Source") all sources for calendars stored on the device.

### `Expo.Calendar.getSourceAsync(id)`

**Available on iOS only.** Returns a specific source selected by ID.

#### Arguments

-   **id : `string`** -- ID of the source to return. Required.

#### Returns

A [source object](#source "Source") matching the provided ID, if one exists.

### `Expo.Calendar.openEventInCalendar(id)`

**Available on Android only.** Sends an intent to open the specified event in the OS Calendar app.

#### Arguments

-   **id : `string`** -- ID of the event to open. Required.

## List of object properties

### Calendar

A calendar record upon which events (or, on iOS, reminders) can be stored. Settings here apply to the calendar as a whole and how its events are displayed in the OS calendar app.

| Field name | Type | Platforms | Description | Possible values |
| --- | --- | --- | --- | --- |
| id | _string_ | both | Internal ID that represents this calendar on the device | |
| title | _string_ | both | Visible name of the calendar | |
| entityType | _string_ | iOS | Whether the calendar is used in the Calendar or Reminders OS app | `Expo.Calendar.EntityTypes.EVENT`, `Expo.Calendar.EntityTypes.REMINDER` |
| source | _Source_ | both | Object representing the source to be used for the calendar | |
| color | _string_ | both | Color used to display this calendar's events | |
| allowsModifications | _boolean_ | both | Boolean value that determines whether this calendar can be modified | |
| type | _string_ | iOS | Type of calendar this object represents | `Expo.Calendar.CalendarType.LOCAL`, `Expo.Calendar.CalendarType.CALDAV`, `Expo.Calendar.CalendarType.EXCHANGE`, `Expo.Calendar.CalendarType.SUBSCRIBED`, `Expo.Calendar.CalendarType.BIRTHDAYS` |
| isPrimary | _boolean_ | Android | Boolean value indicating whether this is the device's primary calendar | |
| name | _string_ | Android | Internal system name of the calendar | |
| ownerAccount | _string_ | Android | Name for the account that owns this calendar | |
| timeZone | _string_ | Android | Time zone for the calendar | |
| allowedAvailabilities | _array_ | both | Availability types that this calendar supports | array of `Expo.Calendar.Availability.BUSY`, `Expo.Calendar.Availability.FREE`, `Expo.Calendar.Availability.TENTATIVE`, `Expo.Calendar.Availability.UNAVAILABLE` (iOS only), `Expo.Calendar.Availability.NOT_SUPPORTED` (iOS only) |
| allowedReminders | _array_ | Android | Alarm methods that this calendar supports | array of `Expo.Calendar.AlarmMethod.ALARM`, `Expo.Calendar.AlarmMethod.ALERT`, `Expo.Calendar.AlarmMethod.EMAIL`, `Expo.Calendar.AlarmMethod.SMS`, `Expo.Calendar.AlarmMethod.DEFAULT` |
| allowedAttendeeTypes | _array_ | Android | Attendee types that this calendar supports | array of `Expo.Calendar.AttendeeType.UNKNOWN` (iOS only), `Expo.Calendar.AttendeeType.PERSON` (iOS only), `Expo.Calendar.AttendeeType.ROOM` (iOS only), `Expo.Calendar.AttendeeType.GROUP` (iOS only), `Expo.Calendar.AttendeeType.RESOURCE`, `Expo.Calendar.AttendeeType.OPTIONAL` (Android only), `Expo.Calendar.AttendeeType.REQUIRED` (Android only), `Expo.Calendar.AttendeeType.NONE` (Android only) |
| isVisible | _boolean_ | Android | Indicates whether the OS displays events on this calendar | |
| isSynced | _boolean_ | Android | Indicates whether this calendar is synced and its events stored on the device | |
| accessLevel | _string_ | Android | Level of access that the user has for the calendar | `Expo.Calendar.CalendarAccessLevel.CONTRIBUTOR`, `Expo.Calendar.CalendarAccessLevel.EDITOR`, `Expo.Calendar.CalendarAccessLevel.FREEBUSY`, `Expo.Calendar.CalendarAccessLevel.OVERRIDE`, `Expo.Calendar.CalendarAccessLevel.OWNER`, `Expo.Calendar.CalendarAccessLevel.READ`, `Expo.Calendar.CalendarAccessLevel.RESPOND`, `Expo.Calendar.CalendarAccessLevel.ROOT`, `Expo.Calendar.CalendarAccessLevel.NONE` |

### Event

An event record, or a single instance of a recurring event. On iOS, used in the Calendar app.

| Field name | Type | Platforms | Description | Possible values |
| --- | --- | --- | --- | --- |
| id | _string_ | both | Internal ID that represents this event on the device | |
| calendarId | _string_ | both | ID of the calendar that contains this event | |
| title | _string_ | both | Visible name of the event | |
| startDate | _Date_ | both | Date object or string representing the time when the event starts | |
| endDate | _Date_ | both | Date object or string representing the time when the event ends | |
| allDay | _boolean_ | both | Whether the event is displayed as an all-day event on the calendar | |
| location | _string_ | both | Location field of the event | |
| notes | _string_ | both | Description or notes saved with the event | |
| alarms | _array_ | both | Array of Alarm objects which control automated reminders to the user | |
| recurrenceRule | _RecurrenceRule_ | both | Object representing rules for recurring or repeating events. Null for one-time events. | |
| availability | _string_ | both | The availability setting for the event | `Expo.Calendar.Availability.BUSY`, `Expo.Calendar.Availability.FREE`, `Expo.Calendar.Availability.TENTATIVE`, `Expo.Calendar.Availability.UNAVAILABLE` (iOS only), `Expo.Calendar.Availability.NOT_SUPPORTED` (iOS only) |
| timeZone | _string_ | both | Time zone the event is scheduled in | |
| endTimeZone | _string_ | Android | Time zone for the event end time | |
| url | _string_ | iOS | URL for the event | |
| creationDate | _string_ | iOS | Date when the event record was created | |
| lastModifiedDate | _string_ | iOS | Date when the event record was last modified | |
| originalStartDate | _string_ | iOS | For recurring events, the start date for the first (original) instance of the event | |
| isDetached | _boolean_ | iOS | Boolean value indicating whether or not the event is a detached (modified) instance of a recurring event | |
| status | _string_ | iOS | Status of the event | `Expo.Calendar.EventStatus.NONE`, `Expo.Calendar.EventStatus.CONFIRMED`, `Expo.Calendar.EventStatus.TENTATIVE`, `Expo.Calendar.EventStatus.CANCELED` |
| organizer | _Attendee_ | iOS | Organizer of the event, as an Attendee object | |
| organizerEmail | _string_ | Android | Email address of the organizer of the event | |
| accessLevel | _string_ | Android | User's access level for the event | `Expo.Calendar.EventAccessLevel.CONFIDENTIAL`, `Expo.Calendar.EventAccessLevel.PRIVATE`, `Expo.Calendar.EventAccessLevel.PUBLIC`, `Expo.Calendar.EventAccessLevel.DEFAULT` |
| guestsCanModify | _boolean_ | Android | Whether invited guests can modify the details of the event | |
| guestsCanInviteOthers | _boolean_ | Android | Whether invited guests can invite other guests | |
| guestsCanSeeGuests | _boolean_ | Android | Whether invited guests can see other guests | |
| originalId | _string_ | Android | For detached (modified) instances of recurring events, the ID of the original recurring event | |
| instanceId | _string_ | Android | For instances of recurring events, volatile ID representing this instance; not guaranteed to always refer to the same instance | |

### Reminder (iOS only)

A reminder record, used in the iOS Reminders app. No direct analog on Android.

| Field name | Type | Description |
| --- | --- | --- |
| id | _string_ | Internal ID that represents this reminder on the device |
| calendarId | _string_ | ID of the calendar that contains this reminder |
| title | _string_ | Visible name of the reminder |
| startDate | _Date_ | Date object or string representing the start date of the reminder task |
| dueDate | _Date_ | Date object or string representing the time when the reminder task is due |
| completed | _boolean_ | Indicates whether or not the task has been completed |
| completionDate | _Date_ | Date object or string representing the date of completion, if `completed` is `true` |
| location | _string_ | Location field of the reminder |
| notes | _string_ | Description or notes saved with the reminder |
| alarms | _array_ | Array of Alarm objects which control automated alarms to the user about the task |
| recurrenceRule | _RecurrenceRule_ | Object representing rules for recurring or repeated reminders. Null for one-time tasks. |
| timeZone | _string_ | Time zone the reminder is scheduled in |
| url | _string_ | URL for the reminder |
| creationDate | _string_ | Date when the reminder record was created |
| lastModifiedDate | _string_ | Date when the reminder record was last modified |

### Attendee

A person or entity that is associated with an event by being invited or fulfilling some other role.

| Field name | Type | Platforms | Description | Possible values |
| --- | --- | --- | --- | --- |
| id | _string_ | Android | Internal ID that represents this attendee on the device | |
| email | _string_ | Android | Email address of the attendee | |
| name | _string_ | both | Displayed name of the attendee | |
| role | _string_ | both | Role of the attendee at the event | `Expo.Calendar.AttendeeRole.UNKNOWN` (iOS only), `Expo.Calendar.AttendeeRole.REQUIRED` (iOS only), `Expo.Calendar.AttendeeRole.OPTIONAL` (iOS only), `Expo.Calendar.AttendeeRole.CHAIR` (iOS only), `Expo.Calendar.AttendeeRole.NON_PARTICIPANT` (iOS only), `Expo.Calendar.AttendeeRole.ATTENDEE` (Android only), `Expo.Calendar.AttendeeRole.ORGANIZER` (Android only), `Expo.Calendar.AttendeeRole.PERFORMER` (Android only), `Expo.Calendar.AttendeeRole.SPEAKER` (Android only), `Expo.Calendar.AttendeeRole.NONE` (Android only) |
| status | _string_ | both | Status of the attendee in relation to the event | `Expo.Calendar.AttendeeStatus.ACCEPTED`, `Expo.Calendar.AttendeeStatus.DECLINED`, `Expo.Calendar.AttendeeStatus.TENTATIVE`, `Expo.Calendar.AttendeeStatus.DELEGATED` (iOS only), `Expo.Calendar.AttendeeStatus.COMPLETED` (iOS only), `Expo.Calendar.AttendeeStatus.IN_PROCESS` (iOS only), `Expo.Calendar.AttendeeStatus.UNKNOWN` (iOS only), `Expo.Calendar.AttendeeStatus.PENDING` (iOS only), `Expo.Calendar.AttendeeStatus.INVITED` (Android only), `Expo.Calendar.AttendeeStatus.NONE` (Android only) |
| type | _string_ | both | Type of the attendee | `Expo.Calendar.AttendeeType.UNKNOWN` (iOS only), `Expo.Calendar.AttendeeType.PERSON` (iOS only), `Expo.Calendar.AttendeeType.ROOM` (iOS only), `Expo.Calendar.AttendeeType.GROUP` (iOS only), `Expo.Calendar.AttendeeType.RESOURCE`, `Expo.Calendar.AttendeeType.OPTIONAL` (Android only), `Expo.Calendar.AttendeeType.REQUIRED` (Android only), `Expo.Calendar.AttendeeType.NONE` (Android only) |
| url | _string_ | iOS | URL for the attendee | |
| isCurrentUser | _boolean_ | iOS | Indicates whether or not this attendee is the current OS user | |

### RecurrenceRule

A recurrence rule for events or reminders, allowing the same calendar item to recur multiple times.

| Field name | Type | Description | Possible values |
| --- | --- | --- | --- |
| frequency | _string_ | How often the calendar item should recur | `Expo.Calendar.Frequency.DAILY`, `Expo.Calendar.Frequency.WEEKLY`, `Expo.Calendar.Frequency.MONTHLY`, `Expo.Calendar.Frequency.YEARLY` |
| interval | _number_ | Interval at which the calendar item should recur. For example, an `interval: 2` with `frequency: DAILY` would yield an event that recurs every other day. Defaults to `1`. | |
| endDate | _Date_ | Date on which the calendar item should stop recurring; overrides `occurrence` if both are specified | |
| occurrence | _number_ | Number of times the calendar item should recur before stopping | |

### Alarm

A method for having the OS automatically remind the user about an calendar item

| Field name | Type | Platforms | Description | Possible values |
| --- | --- | --- | --- | --- |
| absoluteDate | _Date_ | iOS | Date object or string representing an absolute time the alarm should occur; overrides `relativeOffset` and `structuredLocation` if specified alongside either | |
| relativeOffset | _number_ | both | Number of minutes from the `startDate` of the calendar item that the alarm should occur; use negative values to have the alarm occur before the `startDate` | |
| method | _string_ | Android | Method of alerting the user that this alarm should use; on iOS this is always a notification | `Expo.Calendar.AlarmMethod.ALARM`, `Expo.Calendar.AlarmMethod.ALERT`, `Expo.Calendar.AlarmMethod.EMAIL`, `Expo.Calendar.AlarmMethod.SMS`, `Expo.Calendar.AlarmMethod.DEFAULT` |

### Source

A source account that owns a particular calendar. Expo apps will typically not need to interact with Source objects.

| Field name | Type | Platforms | Description | Possible values |
| --- | --- | --- | --- | --- |
| id | _string_ | iOS | Internal ID that represents this source on the device | |
| name | _string_ | both | Name for the account that owns this calendar | |
| type | _string_ | both | Type of account that owns this calendar | on iOS, one of `Expo.Calendar.SourceType.LOCAL`, `Expo.Calendar.SourceType.EXCHANGE`, `Expo.Calendar.SourceType.CALDAV`, `Expo.Calendar.SourceType.MOBILEME`, `Expo.Calendar.SourceType.SUBSCRIBED`, or `Expo.Calendar.SourceType.BIRTHDAYS` |
| isLocalAccount | _boolean_ | Android | Whether this source is the local phone account | |
