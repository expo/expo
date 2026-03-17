package expo.modules.calendar.next.domain.repositories.reminder

import android.content.ContentResolver
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.reminder.ReminderInput
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.safeDelete
import expo.modules.calendar.next.domain.repositories.safeInsert
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.wrappers.EventId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReminderRepository(private val contentResolver: ContentResolver) {
  suspend fun findAllByEventId(eventId: EventId): List<ReminderEntity> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = CalendarContract.Reminders.CONTENT_URI,
      projection = FULL_PROJECTION,
      selection = "${CalendarContract.Reminders.EVENT_ID} = ?",
      selectionArgs = arrayOf(eventId.value.toString())
    ).use { cursor ->
      cursor.asSequence()
        .map { it.toReminderEntity(eventId) }
        .toList()
    }
  }

  suspend fun create(eventId: EventId, input: ReminderInput): Long = withContext(Dispatchers.IO) {
    val uri = contentResolver.safeInsert(
      uri = CalendarContract.Reminders.CONTENT_URI,
      values = input.toContentValues(eventId)
    )
    uri.lastPathSegment
      ?.toLong()
      ?: throw IllegalStateException("Couldn't decode reminder ID from inserted content URI")
  }

  suspend fun deleteAllByEventId(eventId: EventId) = withContext(Dispatchers.IO) {
    contentResolver.safeDelete(
      uri = CalendarContract.Reminders.CONTENT_URI,
      where = "${CalendarContract.Reminders.EVENT_ID} = ?",
      selectionArgs = arrayOf(eventId.value.toString())
    )
  }

  companion object {
    val FULL_PROJECTION = arrayOf(
      CalendarContract.Reminders._ID,
      CalendarContract.Reminders.METHOD,
      CalendarContract.Reminders.MINUTES
    )
  }
}
