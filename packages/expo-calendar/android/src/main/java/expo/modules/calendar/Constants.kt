package expo.modules.calendar

import android.provider.CalendarContract

internal val findCalendarByIdQueryFields = arrayOf(
  CalendarContract.Calendars._ID,
  CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
  CalendarContract.Calendars.ACCOUNT_NAME,
  CalendarContract.Calendars.IS_PRIMARY,
  CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
  CalendarContract.Calendars.ALLOWED_AVAILABILITY,
  CalendarContract.Calendars.NAME,
  CalendarContract.Calendars.ACCOUNT_TYPE,
  CalendarContract.Calendars.CALENDAR_COLOR,
  CalendarContract.Calendars.OWNER_ACCOUNT,
  CalendarContract.Calendars.CALENDAR_TIME_ZONE,
  CalendarContract.Calendars.ALLOWED_REMINDERS,
  CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
  CalendarContract.Calendars.VISIBLE,
  CalendarContract.Calendars.SYNC_EVENTS
)

internal val findAttendeesByEventIdQueryParameters = arrayOf(
  CalendarContract.Attendees._ID,
  CalendarContract.Attendees.ATTENDEE_NAME,
  CalendarContract.Attendees.ATTENDEE_EMAIL,
  CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
  CalendarContract.Attendees.ATTENDEE_TYPE,
  CalendarContract.Attendees.ATTENDEE_STATUS
)

internal val findEventByIdQueryParameters = arrayOf(
  CalendarContract.Events._ID,
  CalendarContract.Events.TITLE,
  CalendarContract.Events.DESCRIPTION,
  CalendarContract.Events.DTSTART,
  CalendarContract.Events.DTEND,
  CalendarContract.Events.ALL_DAY,
  CalendarContract.Events.EVENT_LOCATION,
  CalendarContract.Events.RRULE,
  CalendarContract.Events.CALENDAR_ID,
  CalendarContract.Events.AVAILABILITY,
  CalendarContract.Events.ORGANIZER,
  CalendarContract.Events.EVENT_TIMEZONE,
  CalendarContract.Events.EVENT_END_TIMEZONE,
  CalendarContract.Events.ACCESS_LEVEL,
  CalendarContract.Events.GUESTS_CAN_MODIFY,
  CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS,
  CalendarContract.Events.GUESTS_CAN_SEE_GUESTS,
  CalendarContract.Events.ORIGINAL_ID
)

internal val findEventsQueryParameters = arrayOf(
  CalendarContract.Instances.EVENT_ID,
  CalendarContract.Instances.TITLE,
  CalendarContract.Instances.DESCRIPTION,
  CalendarContract.Instances.BEGIN,
  CalendarContract.Instances.END,
  CalendarContract.Instances.ALL_DAY,
  CalendarContract.Instances.EVENT_LOCATION,
  CalendarContract.Instances.RRULE,
  CalendarContract.Instances.CALENDAR_ID,
  CalendarContract.Instances.AVAILABILITY,
  CalendarContract.Instances.ORGANIZER,
  CalendarContract.Instances.EVENT_TIMEZONE,
  CalendarContract.Instances.EVENT_END_TIMEZONE,
  CalendarContract.Instances.ACCESS_LEVEL,
  CalendarContract.Instances.GUESTS_CAN_MODIFY,
  CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS,
  CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS,
  CalendarContract.Instances.ORIGINAL_ID,
  CalendarContract.Instances._ID
)

internal val findCalendarsQueryParameters = arrayOf(
  CalendarContract.Calendars._ID,
  CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
  CalendarContract.Calendars.ACCOUNT_NAME,
  CalendarContract.Calendars.IS_PRIMARY,
  CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
  CalendarContract.Calendars.ALLOWED_AVAILABILITY,
  CalendarContract.Calendars.NAME,
  CalendarContract.Calendars.ACCOUNT_TYPE,
  CalendarContract.Calendars.CALENDAR_COLOR,
  CalendarContract.Calendars.OWNER_ACCOUNT,
  CalendarContract.Calendars.CALENDAR_TIME_ZONE,
  CalendarContract.Calendars.ALLOWED_REMINDERS,
  CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
  CalendarContract.Calendars.VISIBLE,
  CalendarContract.Calendars.SYNC_EVENTS
)
