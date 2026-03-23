package expo.modules.calendar.next.domain.repositories.event

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.repositories.getOptionalInt
import expo.modules.calendar.next.domain.repositories.getOptionalLong
import expo.modules.calendar.next.domain.repositories.getOptionalString
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

fun Cursor.toEventEntity(): EventEntity {
  return EventEntity(
    id = EventId(
      getOptionalLong(CalendarContract.Events._ID)
        ?: throw IllegalStateException("event ID must not be null")
    ),
    accessLevel = getOptionalInt(CalendarContract.Events.ACCESS_LEVEL)?.let { value ->
      AccessLevel.entries.find { it.value == value }
    },
    allDay = getOptionalInt(CalendarContract.Events.ALL_DAY) == 1,
    availability = getOptionalInt(CalendarContract.Events.AVAILABILITY)?.let { value ->
      Availability.entries.find { it.value == value }
    },
    calendarId = getOptionalLong(CalendarContract.Events.CALENDAR_ID)?.let {
      CalendarId(it)
    },
    description = getOptionalString(CalendarContract.Events.DESCRIPTION),
    dtEnd = getOptionalLong(CalendarContract.Events.DTEND)
      ?: throw IllegalStateException("event end date must not be null"),
    dtStart = getOptionalLong(CalendarContract.Events.DTSTART)
      ?: throw IllegalStateException("event start date must not be null"),
    eventEndTimezone = getOptionalString(CalendarContract.Events.EVENT_END_TIMEZONE),
    eventLocation = getOptionalString(CalendarContract.Events.EVENT_LOCATION),
    eventTimezone = getOptionalString(CalendarContract.Events.EVENT_TIMEZONE),
    guestsCanInviteOthers = getOptionalInt(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) == 1,
    guestsCanModify = getOptionalInt(CalendarContract.Events.GUESTS_CAN_MODIFY) == 1,
    guestsCanSeeGuests = getOptionalInt(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) == 1,
    organizer = getOptionalString(CalendarContract.Events.ORGANIZER),
    originalId = getOptionalString(CalendarContract.Events.ORIGINAL_ID)?.let {
      EventId(it.toLong())
    },
    rrule = getOptionalString(CalendarContract.Events.RRULE)
      ?.takeIf { it.isNotBlank() }
      ?.let { RecurrenceRule.fromRuleString(it) },
    status = getOptionalInt(CalendarContract.Events.STATUS)?.let { value ->
      Status.entries.find { it.value == value }
    },
    title = getOptionalString(CalendarContract.Events.TITLE)
  )
}
