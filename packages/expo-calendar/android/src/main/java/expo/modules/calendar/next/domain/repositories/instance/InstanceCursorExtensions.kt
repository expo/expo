package expo.modules.calendar.next.domain.repositories.instance

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.repositories.getOptionalInt
import expo.modules.calendar.next.domain.repositories.getOptionalLong
import expo.modules.calendar.next.domain.repositories.getOptionalString
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

fun Cursor.toInstanceEntity(): InstanceEntity {
  return InstanceEntity(
    accessLevel = getOptionalInt(CalendarContract.Instances.ACCESS_LEVEL)?.let {
      AccessLevel.fromAndroidValue(it)
    },
    allDay = getOptionalInt(CalendarContract.Instances.ALL_DAY) == 1,
    availability = getOptionalInt(CalendarContract.Instances.AVAILABILITY)?.let {
      Availability.fromAndroidValue(it)
    },
    begin = getOptionalLong(CalendarContract.Instances.BEGIN)
      ?: throw IllegalStateException("instance begin must not be null"),
    calendarId = getOptionalLong(CalendarContract.Instances.CALENDAR_ID)?.let {
      CalendarId(it)
    },
    description = getOptionalString(CalendarContract.Instances.DESCRIPTION),
    end = getOptionalLong(CalendarContract.Instances.END)
      ?: throw IllegalStateException("instance end must not be null"),
    eventEndTimezone = getOptionalString(CalendarContract.Instances.EVENT_END_TIMEZONE),
    eventId = EventId(
      getOptionalLong(CalendarContract.Instances.EVENT_ID)
        ?: throw IllegalStateException("instance eventId must not be null")
    ),
    eventLocation = getOptionalString(CalendarContract.Instances.EVENT_LOCATION),
    eventTimezone = getOptionalString(CalendarContract.Instances.EVENT_TIMEZONE),
    guestsCanInviteOthers = getOptionalInt(CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS) == 1,
    guestsCanModify = getOptionalInt(CalendarContract.Instances.GUESTS_CAN_MODIFY) == 1,
    guestsCanSeeGuests = getOptionalInt(CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS) == 1,
    organizer = getOptionalString(CalendarContract.Instances.ORGANIZER),
    originalId = getOptionalLong(CalendarContract.Instances.ORIGINAL_ID)?.let {
      EventId(it)
    },
    rrule = getOptionalString(CalendarContract.Instances.RRULE)
      ?.takeIf { it.isNotBlank() }
      ?.let { RecurrenceRule.fromRuleString(it) },
    status = getOptionalInt(CalendarContract.Instances.STATUS)
      ?.let { Status.fromAndroidValue(it) },
    title = getOptionalString(CalendarContract.Instances.TITLE),
    id = getOptionalLong(CalendarContract.Instances._ID)
      ?: throw IllegalStateException("instance ID must not be null")
  )
}
