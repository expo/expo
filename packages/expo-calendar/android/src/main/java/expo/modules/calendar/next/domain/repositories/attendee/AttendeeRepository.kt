package expo.modules.calendar.next.domain.repositories.attendee

import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.attendee.AttendeeInput
import expo.modules.calendar.next.domain.dto.attendee.AttendeeUpdate
import expo.modules.calendar.next.domain.model.attendee.AttendeeEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.safeDelete
import expo.modules.calendar.next.domain.repositories.safeInsert
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.repositories.safeUpdate
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.calendar.next.domain.wrappers.EventId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AttendeeRepository(private val contentResolver: ContentResolver) {
  suspend fun findAllByEventId(eventId: EventId): List<AttendeeEntity> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = CalendarContract.Attendees.CONTENT_URI,
      projection = FULL_PROJECTION,
      selection = "${CalendarContract.Attendees.EVENT_ID} = ?",
      selectionArgs = arrayOf(eventId.value.toString())
    ).use { cursor ->
      cursor.asSequence()
        .map { it.toAttendeeEntity() }
        .toList()
    }
  }

  suspend fun create(attendeeInput: AttendeeInput): AttendeeId = withContext(Dispatchers.IO) {
    val uri = contentResolver.safeInsert(
      uri = CalendarContract.Attendees.CONTENT_URI,
      values = attendeeInput.toContentValues()
    )
    val id = uri.lastPathSegment
      ?: throw IllegalStateException("Couldn't decode attendee ID from inserted content URI")
    AttendeeId(id.toLong())
  }

  suspend fun update(attendeeUpdate: AttendeeUpdate): Boolean = withContext(Dispatchers.IO) {
    contentResolver.safeUpdate(
      uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeUpdate.id.value),
      values = attendeeUpdate.toContentValues()
    ) > 0
  }

  suspend fun findById(id: AttendeeId): AttendeeEntity? = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, id.value),
      projection = FULL_PROJECTION
    ).use { cursor ->
      cursor.takeIf { it.moveToFirst() }
        ?.toAttendeeEntity()
    }
  }

  suspend fun delete(id: AttendeeId): Boolean = withContext(Dispatchers.IO) {
    contentResolver.safeDelete(
      uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, id.value)
    ) > 0
  }

  private fun AttendeeInput.toContentValues() = ContentValues().apply {
    put(CalendarContract.Attendees.ATTENDEE_EMAIL, email)
    put(CalendarContract.Attendees.ATTENDEE_NAME, name)
    put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, role?.value)
    put(CalendarContract.Attendees.ATTENDEE_STATUS, status?.value)
    put(CalendarContract.Attendees.ATTENDEE_TYPE, type?.value)
    put(CalendarContract.Attendees.EVENT_ID, eventId.value)
  }

  private fun AttendeeUpdate.toContentValues() = ContentValues().apply {
    if (!email.isUndefined) {
      put(CalendarContract.Attendees.ATTENDEE_EMAIL, email.optional)
    }
    if (!name.isUndefined) {
      put(CalendarContract.Attendees.ATTENDEE_NAME, name.optional)
    }
    if (!role.isUndefined) {
      put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, role.optional?.value)
    }
    if (!status.isUndefined) {
      put(CalendarContract.Attendees.ATTENDEE_STATUS, status.optional?.value)
    }
    if (!type.isUndefined) {
      put(CalendarContract.Attendees.ATTENDEE_TYPE, type.optional?.value)
    }
  }

  companion object {
    val FULL_PROJECTION = arrayOf(
      CalendarContract.Attendees._ID,
      CalendarContract.Attendees.ATTENDEE_EMAIL,
      CalendarContract.Attendees.ATTENDEE_NAME,
      CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
      CalendarContract.Attendees.ATTENDEE_STATUS,
      CalendarContract.Attendees.ATTENDEE_TYPE
    )
  }
}
