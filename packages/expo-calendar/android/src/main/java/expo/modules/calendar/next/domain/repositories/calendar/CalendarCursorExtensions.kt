package expo.modules.calendar.next.domain.repositories.calendar

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.calendar.AllowedAttendeeType
import expo.modules.calendar.next.domain.model.calendar.AllowedAvailability
import expo.modules.calendar.next.domain.model.calendar.AllowedReminder
import expo.modules.calendar.next.domain.model.calendar.CalendarAccessLevel
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.repositories.getList
import expo.modules.calendar.next.domain.repositories.getOptionalInt
import expo.modules.calendar.next.domain.repositories.getOptionalLong
import expo.modules.calendar.next.domain.repositories.getOptionalString
import expo.modules.calendar.next.domain.wrappers.CalendarId

fun Cursor.toCalendarEntity() = CalendarEntity(
  id = CalendarId(
    getOptionalLong(CalendarContract.Calendars._ID)
      ?: throw IllegalStateException("calendar ID must not be null")
  ),
  accountName = getOptionalString(CalendarContract.Calendars.ACCOUNT_NAME),
  accountType = getOptionalString(CalendarContract.Calendars.ACCOUNT_TYPE),
  allowedAttendeeTypes = getList(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES) { value ->
    AllowedAttendeeType.entries.find { it.value == value }
  }.filterNotNull(),
  allowedAvailability = getList(CalendarContract.Calendars.ALLOWED_AVAILABILITY) { value ->
    AllowedAvailability.entries.find { it.value == value }
  }.filterNotNull(),
  allowedReminders = getList(CalendarContract.Calendars.ALLOWED_REMINDERS) { value ->
    AllowedReminder.entries.find { it.value == value }
  }.filterNotNull(),
  calendarAccessLevel = getOptionalInt(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)?.let { value ->
    CalendarAccessLevel.entries.find { it.value == value }
  },
  calendarColor = getOptionalInt(CalendarContract.Calendars.CALENDAR_COLOR),
  calendarDisplayName = getOptionalString(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME),
  calendarTimeZone = getOptionalString(CalendarContract.Calendars.CALENDAR_TIME_ZONE),
  isPrimary = getOptionalInt(CalendarContract.Calendars.IS_PRIMARY) == 1,
  name = getOptionalString(CalendarContract.Calendars.NAME),
  ownerAccount = getOptionalString(CalendarContract.Calendars.OWNER_ACCOUNT),
  syncEvents = getOptionalInt(CalendarContract.Calendars.SYNC_EVENTS) == 1,
  visible = getOptionalInt(CalendarContract.Calendars.VISIBLE) == 1
)
