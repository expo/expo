package expo.modules.calendar.domain.attendee

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.provider.CalendarContract
import expo.modules.calendar.domain.attendee.extensions.extractAttendee
import expo.modules.calendar.domain.attendee.records.Attendee
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

class AttendeeRepository(context: Context) {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef.get()?.contentResolver ?: throw Exceptions.ReactContextLost()

  suspend fun findAttendeesByEventId(eventID: String): List<Attendee> = withContext(Dispatchers.IO) {
    val cursor = CalendarContract.Attendees.query(
      contentResolver,
      eventID.toLong(),
      findAttendeesByEventIdQueryParameters
    )

    return@withContext cursor.use { cursor ->
      val results = mutableListOf<Attendee>()
      while (cursor.moveToNext()) {
        results.add(cursor.extractAttendee())
      }
      results
    }
  }

  suspend fun saveAttendeeForEvent(attendee: Attendee, eventID: String?): Int {
    return if (attendee.isNewAttendeePayload) {
      contentResolver.insertAttendee(attendee, eventID)
    } else {
      contentResolver.updateAttendee(attendee)
    }
  }

  suspend fun deleteAttendee(attendeeID: String): Boolean {
    val rows: Int
    val uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toInt().toLong())
    rows = withContext(Dispatchers.IO) {
      contentResolver.delete(uri, null, null)
    }
    return rows > 0
  }

  companion object {
    val findAttendeesByEventIdQueryParameters = arrayOf(
      CalendarContract.Attendees._ID,
      CalendarContract.Attendees.ATTENDEE_NAME,
      CalendarContract.Attendees.ATTENDEE_EMAIL,
      CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
      CalendarContract.Attendees.ATTENDEE_TYPE,
      CalendarContract.Attendees.ATTENDEE_STATUS
    )
  }
}

private suspend fun ContentResolver.insertAttendee(attendee: Attendee, eventID: String?): Int {
  val contentValues = attendee.toContentValues().apply {
    put(CalendarContract.Attendees.EVENT_ID, eventID?.toInt())
  }

  val attendeesUri = CalendarContract.Attendees.CONTENT_URI
  val attendeeUri = withContext(Dispatchers.IO) { insert(attendeesUri, contentValues) }
  return attendeeUri!!.lastPathSegment!!.toInt()
}

private suspend fun ContentResolver.updateAttendee(attendee: Attendee): Int {
  val attendeeID = requireNotNull(attendee.id?.toInt()) { "Attendee ID must be present when updating" }

  val updateUri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())

  withContext(Dispatchers.IO) {
    update(updateUri, attendee.toContentValues(), null, null)
  }
  return attendeeID
}
