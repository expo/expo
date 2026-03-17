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
    val id = uri.lastPathSegment?.toLongOrNull()
      ?: throw EventNotSavedException("Couldn't decode event ID from inserted content URI")
    return@withContext id
  }

  suspend fun update(id: EventId, eventUpdate: EventUpdate): Boolean = withContext(Dispatchers.IO) {
    contentResolver.safeUpdate(
      uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id.value),
      values = eventUpdate.toContentValues()
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

  private fun EventUpdate.toContentValues() = ContentValues().apply {
    if (!dtStart.isUndefined) {
      put(CalendarContract.Events.DTSTART, dtStart.optional)
    }
    if (!dtEnd.isUndefined) {
      put(CalendarContract.Events.DTEND, dtEnd.optional)
    }

    if (!rrule.isUndefined) {
      val recurrence = rrule.optional
      if (recurrence != null && recurrence.frequency.isNotEmpty()) {
        if (recurrence.endDate == null && recurrence.occurrence == null) {
          val eventStartDate = getAsLong(CalendarContract.Events.DTSTART)
          val eventEndDate = getAsLong(CalendarContract.Events.DTEND)
          val duration = (eventEndDate - eventStartDate) / 1000

          putNull(CalendarContract.Events.LAST_DATE)
          putNull(CalendarContract.Events.DTEND)
          put(CalendarContract.Events.DURATION, "PT${duration}S")
        }
        put(CalendarContract.Events.RRULE, recurrence.toRuleString())
      } else {
        putNull(CalendarContract.Events.RRULE)
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

  companion object {
    val FULL_PROJECTION = arrayOf(
      CalendarContract.Events._ID,
      CalendarContract.Events.ACCESS_LEVEL,
      CalendarContract.Events.ALL_DAY,
      CalendarContract.Events.AVAILABILITY,
      CalendarContract.Events.CALENDAR_ID,
      CalendarContract.Events.DESCRIPTION,
      CalendarContract.Events.DTEND,
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
