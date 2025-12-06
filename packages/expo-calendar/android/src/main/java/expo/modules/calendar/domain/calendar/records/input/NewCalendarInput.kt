package expo.modules.calendar.domain.calendar.records.input

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.domain.attendee.enums.AttendeeType
import expo.modules.calendar.domain.calendar.enums.CalendarAccessLevel
import expo.modules.calendar.domain.calendar.records.CalendarSource
import expo.modules.calendar.domain.event.enums.AlarmMethod
import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import java.util.TimeZone

data class NewCalendarInput(
  @Field @Required val name: String,
  @Field @Required val title: String,
  @Field @Required val source: CalendarSource,
  @Field @Required val color: Int,
  @Field @Required val ownerAccount: String,
  @Field @Required val accessLevel: CalendarAccessLevel,
  @Field val isPrimary: Boolean?,
  @Field val allowedAvailabilities: List<Availability>?,
  @Field val timeZone: String?,
  @Field val allowedReminders: List<AlarmMethod>?,
  @Field val allowedAttendeeTypes: List<AttendeeType>?,
  @Field val isVisible: Boolean?,
  @Field val isSynced: Boolean?,
  @Field val allowsModifications: Boolean?
) : Record {
  fun toContentValues() = ContentValues().apply {
    source.assertValidForNewCalendar()

    put(CalendarContract.Calendars.NAME, name)
    put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, title)
    put(CalendarContract.Calendars.VISIBLE, isVisible)
    put(CalendarContract.Calendars.SYNC_EVENTS, isSynced)
    put(CalendarContract.Calendars.ACCOUNT_NAME, source.name)
    put(CalendarContract.Calendars.ACCOUNT_TYPE, source.resolvedType)
    put(CalendarContract.Calendars.CALENDAR_COLOR, color)
    put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, accessLevel.contentProviderValue)
    put(CalendarContract.Calendars.OWNER_ACCOUNT, ownerAccount)

    put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, timeZone ?: TimeZone.getDefault().id)
    allowedReminders?.let { reminders ->
      val value = reminders.map { it.contentProviderValue }.joinToString(",")
      put(CalendarContract.Calendars.ALLOWED_REMINDERS, value)
    }
    allowedAvailabilities?.let { availabilities ->
      val value = availabilities.map { it.contentProviderValue }.joinToString(",")
      put(CalendarContract.Calendars.ALLOWED_AVAILABILITY, value)
    }
    allowedAttendeeTypes?.let { types ->
      val value = types.map { it.contentProviderValue }.joinToString(",")
      put(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES, value)
    }
  }
}
