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
  val start = getOptionalLong(CalendarContract.Events.DTSTART)
  val duration = getOptionalString(CalendarContract.Events.DURATION)
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
    dtEnd = getOptionalLong(CalendarContract.Events.DTEND) ?: if (start != null && duration != null) {
      rfc2445DurationMillis(duration)?.let { runCatching { Math.addExact(start, it) }.getOrNull() }
    } else {
      null
    },
    dtStart = start,
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

private val providerDuration = Regex("""([+-])?P(?:(\d+)W|(?:(\d+)D)?(?:T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?)""")

/** CalendarProvider also accepts the time form without T, for example P3600S. */
internal fun rfc2445DurationMillis(value: String): Long? {
  val match = providerDuration.matchEntire(value) ?: return null
  val parts = match.groupValues
  if (parts.drop(2).all { it.isEmpty() } || value.endsWith('T')) {
    return null
  }
  return runCatching {
    val units = listOf(604800L, 86400L, 3600L, 60L, 1L)
    val seconds = units.foldIndexed(0L) { i, total, unit ->
      val quantity = parts[i + 2].ifEmpty { "0" }.toLong()
      Math.addExact(total, Math.multiplyExact(quantity, unit))
    }
    Math.multiplyExact(seconds, if (parts[1] == "-") -1000L else 1000L)
  }.getOrNull()
}
