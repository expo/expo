package expo.modules.calendar.domain.calendar.extensions

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.domain.attendee.enums.AttendeeType
import expo.modules.calendar.domain.calendar.enums.CalendarAccessLevel
import expo.modules.calendar.domain.calendar.records.CalendarEntity
import expo.modules.calendar.domain.calendar.records.CalendarSource
import expo.modules.calendar.domain.event.enums.AlarmMethod
import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.calendar.extensions.getIntOrDefault
import expo.modules.calendar.extensions.getOptionalString
import expo.modules.calendar.extensions.getValueList

fun Cursor.extractCalendar(): CalendarEntity {
  val accessLevel = getIntOrDefault(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)
  val color = String.format("#%06X", 0xFFFFFF and getIntOrDefault(CalendarContract.Calendars.CALENDAR_COLOR))

  val allowedAvailabilities = getValueList(CalendarContract.Calendars.ALLOWED_AVAILABILITY) { Availability.fromContentProviderValue(it) }
  val allowedReminders = getValueList(CalendarContract.Calendars.ALLOWED_REMINDERS) { AlarmMethod.fromContentProviderValue(it) }
  val allowedAttendeeTypes = getValueList(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES) { AttendeeType.fromContentProviderValue(it) }

  return CalendarEntity(
    id = getOptionalString(CalendarContract.Calendars._ID),
    name = getOptionalString(CalendarContract.Calendars.NAME),
    title = getOptionalString(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME),
    isPrimary = getIntOrDefault(CalendarContract.Calendars.IS_PRIMARY) == 1,
    color = color,
    ownerAccount = getOptionalString(CalendarContract.Calendars.OWNER_ACCOUNT),
    timeZone = getOptionalString(CalendarContract.Calendars.CALENDAR_TIME_ZONE),
    allowedAvailabilities = allowedAvailabilities,
    allowedReminders = allowedReminders,
    allowedAttendeeTypes = allowedAttendeeTypes,
    isVisible = getIntOrDefault(CalendarContract.Calendars.VISIBLE) != 0,
    isSynced = getIntOrDefault(CalendarContract.Calendars.SYNC_EVENTS) != 0,
    accessLevel = CalendarAccessLevel.fromContentProviderValue(accessLevel),
    allowsModifications = accessLevel == CalendarContract.Calendars.CAL_ACCESS_ROOT ||
      accessLevel == CalendarContract.Calendars.CAL_ACCESS_OWNER ||
      accessLevel == CalendarContract.Calendars.CAL_ACCESS_EDITOR ||
      accessLevel == CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR,
    source = CalendarSource(
      name = getOptionalString(CalendarContract.Calendars.ACCOUNT_NAME),
      type = getOptionalString(CalendarContract.Calendars.ACCOUNT_TYPE)
    )
  )
}
