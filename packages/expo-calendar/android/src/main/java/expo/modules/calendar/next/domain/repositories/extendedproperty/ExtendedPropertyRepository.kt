package expo.modules.calendar.next.domain.repositories.extendedproperty

import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.extendedproperty.ExtendedPropertyInput
import expo.modules.calendar.next.domain.model.calendar.CalendarAccount
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.asSyncAdapter
import expo.modules.calendar.next.domain.repositories.safeDelete
import expo.modules.calendar.next.domain.repositories.safeInsert
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.repositories.safeUpdate
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Access to `CalendarContract.ExtendedProperties`, the per-event key/value table.
 *
 * Reads go through the plain URI. Writes go through [asSyncAdapter], because the provider rejects
 * every other caller, and are addressed to a single row, because the provider only understands
 * updates and deletes that carry a row id in their path.
 */
class ExtendedPropertyRepository(private val contentResolver: ContentResolver) {
  suspend fun findAllByEventId(eventId: EventId): List<ExtendedPropertyEntity> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = CalendarContract.ExtendedProperties.CONTENT_URI,
      projection = FULL_PROJECTION,
      selection = "${CalendarContract.ExtendedProperties.EVENT_ID} = ?",
      selectionArgs = arrayOf(eventId.value.toString())
    ).use { cursor ->
      cursor.asSequence()
        .map { it.toExtendedPropertyEntity(eventId) }
        .toList()
    }
  }

  /**
   * Every row stored under [name] on the event. The table has no unique constraint on
   * (`EVENT_ID`, `NAME`), so a name can carry more than one row: two concurrent writes, or another
   * app writing the same name, both produce duplicates.
   */
  suspend fun findAllByName(eventId: EventId, name: String): List<ExtendedPropertyEntity> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = CalendarContract.ExtendedProperties.CONTENT_URI,
      projection = FULL_PROJECTION,
      selection = "${CalendarContract.ExtendedProperties.EVENT_ID} = ? AND ${CalendarContract.ExtendedProperties.NAME} = ?",
      selectionArgs = arrayOf(eventId.value.toString(), name)
    ).use { cursor ->
      cursor.asSequence()
        .map { it.toExtendedPropertyEntity(eventId) }
        .toList()
    }
  }

  /**
   * Writes [input] on the event, leaving exactly one row under that name.
   *
   * Any duplicate the table already holds under the same name is removed, so a name that ended up
   * with several rows converges back to one on the next write rather than staying ambiguous.
   */
  suspend fun upsert(
    eventId: EventId,
    account: CalendarAccount,
    input: ExtendedPropertyInput
  ): ExtendedPropertyId = withContext(Dispatchers.IO) {
    val existing = findAllByName(eventId, input.name)
    existing.drop(1).forEach { duplicate ->
      deleteById(duplicate.id, account)
    }

    val kept = existing.firstOrNull()
    if (kept != null) {
      val updated = contentResolver.safeUpdate(
        uri = ContentUris.withAppendedId(CalendarContract.ExtendedProperties.CONTENT_URI, kept.id.value)
          .asSyncAdapter(account),
        values = ContentValues().apply {
          put(CalendarContract.ExtendedProperties.VALUE, input.value)
        }
      ) > 0
      if (updated) {
        return@withContext kept.id
      }
      // The row was removed between the two calls, so it is written again below.
    }

    val uri = contentResolver.safeInsert(
      uri = CalendarContract.ExtendedProperties.CONTENT_URI.asSyncAdapter(account),
      values = input.toContentValues(eventId)
    )
    ExtendedPropertyId(
      uri.lastPathSegment?.toLongOrNull()
        ?: throw IllegalStateException("Couldn't decode extended property ID from inserted content URI")
    )
  }

  /**
   * Removes every row stored under [name] on the event.
   *
   * @return whether at least one row was removed.
   */
  suspend fun deleteByName(
    eventId: EventId,
    account: CalendarAccount,
    name: String
  ): Boolean = withContext(Dispatchers.IO) {
    findAllByName(eventId, name)
      .sumOf { deleteById(it.id, account) } > 0
  }

  private suspend fun deleteById(id: ExtendedPropertyId, account: CalendarAccount): Int =
    contentResolver.safeDelete(
      uri = ContentUris.withAppendedId(CalendarContract.ExtendedProperties.CONTENT_URI, id.value)
        .asSyncAdapter(account)
    )

  private fun ExtendedPropertyInput.toContentValues(eventId: EventId) = ContentValues().apply {
    put(CalendarContract.ExtendedProperties.EVENT_ID, eventId.value)
    put(CalendarContract.ExtendedProperties.NAME, name)
    put(CalendarContract.ExtendedProperties.VALUE, value)
  }

  companion object {
    val FULL_PROJECTION = arrayOf(
      CalendarContract.ExtendedProperties._ID,
      CalendarContract.ExtendedProperties.NAME,
      CalendarContract.ExtendedProperties.VALUE
    )
  }
}
