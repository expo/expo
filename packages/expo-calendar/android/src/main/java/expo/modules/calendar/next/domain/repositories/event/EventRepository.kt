package expo.modules.calendar.next.domain.repositories.event

import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.exceptions.EventNotSavedException
import expo.modules.calendar.next.domain.dto.event.EventExceptionInput
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.dto.event.EventInput
import expo.modules.calendar.next.domain.dto.event.EventUpdate
import expo.modules.calendar.next.domain.repositories.safeDelete
import expo.modules.calendar.next.domain.repositories.safeInsert
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.repositories.safeUpdate
import expo.modules.calendar.next.domain.wrappers.EventId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.TimeZone

class EventRepository(private val contentResolver: ContentResolver) {
  suspend fun findById(id: EventId): EventEntity? = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id.value),
      projection = FULL_PROJECTION,
      selection = "${CalendarContract.Events.DELETED} != 1"
    ).use { cursor ->
      cursor.takeIf { it.moveToFirst() }
        ?.toEventEntity()
    }
  }

  suspend fun insert(eventInput: EventInput): Long = withContext(Dispatchers.IO) {
    val uri = contentResolver.safeInsert(
      CalendarContract.Events.CONTENT_URI,
      eventInput.toContentValues()
    )
    return@withContext runCatching {
      requireNotNull(uri.lastPathSegment).toLong()
    }.onFailure { e ->
      throw EventNotSavedException("Couldn't decode event ID from inserted content URI", cause = e)
    }.getOrThrow()
  }

  suspend fun update(id: EventId, eventUpdate: EventUpdate): Boolean = withContext(Dispatchers.IO) {
    val missingTimingFields = with(eventUpdate) {
      listOf(dtStart, dtEnd, rrule, allDay).count { it.isUndefined }
    }
    val existing = if (missingTimingFields in 1..3) {
      findById(id) ?: return@withContext false
    } else {
      null
    }
    contentResolver.safeUpdate(
      uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id.value),
      values = eventUpdate.toContentValues(existing)
    ) > 0
  }

  suspend fun remove(id: EventId): Boolean = withContext(Dispatchers.IO) {
    contentResolver.safeDelete(
      uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id.value)
    ) > 0
  }

  suspend fun insertException(id: EventId, eventExceptionInput: EventExceptionInput) = withContext(Dispatchers.IO) {
    contentResolver.safeInsert(
      uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_EXCEPTION_URI, id.value),
      values = eventExceptionInput.toContentValues()
    )
  }

  private fun EventInput.toContentValues() = ContentValues().apply {
    dtStart?.let {
      put(CalendarContract.Events.DTSTART, it)
    }
    dtEnd?.let {
      put(CalendarContract.Events.DTEND, it)
    }
    rrule?.let { recurrence ->
      if (recurrence.frequency.isEmpty()) {
        return@let
      }

      putRecurringDuration(dtStart, dtEnd, allDay == true)
      put(CalendarContract.Events.RRULE, recurrence.toRuleString())
    }

    availability?.let {
      put(CalendarContract.Events.AVAILABILITY, it.value)
    }
    title?.let {
      put(CalendarContract.Events.TITLE, it)
    }
    description?.let {
      put(CalendarContract.Events.DESCRIPTION, it)
    }
    eventLocation?.let {
      put(CalendarContract.Events.EVENT_LOCATION, it)
    }
    organizer?.let {
      put(CalendarContract.Events.ORGANIZER, it)
    }
    allDay?.let {
      put(CalendarContract.Events.ALL_DAY, it)
    }
    guestsCanModify?.let {
      put(CalendarContract.Events.GUESTS_CAN_MODIFY, it)
    }
    guestsCanInviteOthers?.let {
      put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, it)
    }
    guestsCanSeeGuests?.let {
      put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, it)
    }
    accessLevel?.let {
      put(CalendarContract.Events.ACCESS_LEVEL, it.value)
    }

    val defaultTimezoneId = TimeZone.getDefault().id
    put(CalendarContract.Events.EVENT_TIMEZONE, eventTimezone ?: defaultTimezoneId)
    put(CalendarContract.Events.EVENT_END_TIMEZONE, eventEndTimezone ?: defaultTimezoneId)
    calendarId?.let {
      put(CalendarContract.Events.CALENDAR_ID, it.value)
    }
  }

  private fun EventUpdate.toContentValues(existing: EventEntity?) = ContentValues().apply {
    if (!dtStart.isUndefined) {
      put(CalendarContract.Events.DTSTART, dtStart.optional)
    }
    if (!dtEnd.isUndefined) {
      put(CalendarContract.Events.DTEND, dtEnd.optional)
    }

    val rule = if (rrule.isUndefined) existing?.rrule else rrule.optional
    val hasRecurrence = !rule?.frequency.isNullOrEmpty()
    if (hasRecurrence) {
      val start = if (dtStart.isUndefined) existing?.dtStart else dtStart.optional
      val end = if (dtEnd.isUndefined && !dtStart.isUndefined && start != null && existing?.dtStart != null && existing.dtEnd != null) {
        Math.addExact(start, Math.subtractExact(existing.dtEnd, existing.dtStart))
      } else if (dtEnd.isUndefined) {
        existing?.dtEnd
      } else {
        dtEnd.optional
      }
      putRecurringDuration(start, end, (allDay.optional ?: existing?.allDay) == true)
    }
    if (!rrule.isUndefined) {
      if (hasRecurrence) {
        put(CalendarContract.Events.RRULE, rule?.toRuleString())
      } else {
        putNull(CalendarContract.Events.RRULE)
        putNull(CalendarContract.Events.DURATION)
        val end = if (dtEnd.isUndefined) existing?.dtEnd else dtEnd.optional
        put(CalendarContract.Events.DTEND, requireNotNull(end) { "Provide endDate when clearing a recurrence rule with no stored end date" })
      }
    }

    if (!availability.isUndefined) {
      put(CalendarContract.Events.AVAILABILITY, availability.optional?.value)
    }
    if (!title.isUndefined) {
      put(CalendarContract.Events.TITLE, title.optional)
    }
    if (!description.isUndefined) {
      put(CalendarContract.Events.DESCRIPTION, description.optional)
    }
    if (!eventLocation.isUndefined) {
      put(CalendarContract.Events.EVENT_LOCATION, eventLocation.optional)
    }
    if (!organizer.isUndefined) {
      put(CalendarContract.Events.ORGANIZER, organizer.optional)
    }
    if (!allDay.isUndefined) {
      put(CalendarContract.Events.ALL_DAY, allDay.optional)
    }
    if (!guestsCanModify.isUndefined) {
      put(CalendarContract.Events.GUESTS_CAN_MODIFY, guestsCanModify.optional)
    }
    if (!guestsCanInviteOthers.isUndefined) {
      put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, guestsCanInviteOthers.optional)
    }
    if (!guestsCanSeeGuests.isUndefined) {
      put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, guestsCanSeeGuests.optional)
    }
    if (!accessLevel.isUndefined) {
      put(CalendarContract.Events.ACCESS_LEVEL, accessLevel.optional?.value)
    }
    if (!eventTimezone.isUndefined) {
      put(CalendarContract.Events.EVENT_TIMEZONE, eventTimezone.optional)
    }
    if (!eventEndTimezone.isUndefined) {
      put(CalendarContract.Events.EVENT_END_TIMEZONE, eventEndTimezone.optional)
    }
  }

  private fun ContentValues.putRecurringDuration(start: Long?, end: Long?, allDay: Boolean) {
    requireNotNull(start) { "Missing recurring event start date" }
    requireNotNull(end) { "Missing recurring event end date" }
    val millis = Math.subtractExact(end, start)
    require(millis >= 0) { "Recurring event end date precedes its start date" }
    val duration = if (allDay && millis % 86_400_000L == 0L) "P${millis / 86_400_000L}D" else "PT${millis / 1000L}S"
    putNull(CalendarContract.Events.LAST_DATE)
    putNull(CalendarContract.Events.DTEND)
    put(CalendarContract.Events.DURATION, duration)
  }

  companion object {
    val FULL_PROJECTION = arrayOf(
      CalendarContract.Events._ID,
      CalendarContract.Events.ACCESS_LEVEL,
      CalendarContract.Events.ALL_DAY,
      CalendarContract.Events.AVAILABILITY,
      CalendarContract.Events.CALENDAR_ID,
      CalendarContract.Events.DESCRIPTION,
      CalendarContract.Events.DTEND,
      CalendarContract.Events.DURATION,
      CalendarContract.Events.DTSTART,
      CalendarContract.Events.EVENT_END_TIMEZONE,
      CalendarContract.Events.EVENT_LOCATION,
      CalendarContract.Events.EVENT_TIMEZONE,
      CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS,
      CalendarContract.Events.GUESTS_CAN_MODIFY,
      CalendarContract.Events.GUESTS_CAN_SEE_GUESTS,
      CalendarContract.Events.ORGANIZER,
      CalendarContract.Events.ORIGINAL_ID,
      CalendarContract.Events.RRULE,
      CalendarContract.Events.STATUS,
      CalendarContract.Events.TITLE
    )
  }
}
