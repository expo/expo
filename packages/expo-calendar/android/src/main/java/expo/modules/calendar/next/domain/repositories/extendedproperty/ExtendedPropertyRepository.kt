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

  suspend fun findByName(eventId: EventId, name: String): ExtendedPropertyEntity? = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = CalendarContract.ExtendedProperties.CONTENT_URI,
      projection = FULL_PROJECTION,
      selection = "${CalendarContract.ExtendedProperties.EVENT_ID} = ? AND ${CalendarContract.ExtendedProperties.NAME} = ?",
      selectionArgs = arrayOf(eventId.value.toString(), name)
    ).use { cursor ->
      cursor.takeIf { it.moveToFirst() }
        ?.toExtendedPropertyEntity(eventId)
    }
  }

  /**
   * Writes [input] on the event, replacing the value of a property of the same name if there is
   * one — the table itself does not constrain names to be unique per event.
   */
  suspend fun upsert(
    eventId: EventId,
    account: CalendarAccount,
    input: ExtendedPropertyInput
  ): ExtendedPropertyId = withContext(Dispatchers.IO) {
    val existing = findByName(eventId, input.name)
    if (existing != null) {
      val updated = contentResolver.safeUpdate(
        uri = ContentUris.withAppendedId(CalendarContract.ExtendedProperties.CONTENT_URI, existing.id.value)
          .asSyncAdapter(account),
        values = ContentValues().apply {
          put(CalendarContract.ExtendedProperties.VALUE, input.value)
        }
      ) > 0
      if (updated) {
        return@withContext existing.id
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

  suspend fun deleteByName(
    eventId: EventId,
    account: CalendarAccount,
    name: String
  ): Boolean = withContext(Dispatchers.IO) {
    val existing = findByName(eventId, name)
      ?: return@withContext false
    contentResolver.safeDelete(
      uri = ContentUris.withAppendedId(CalendarContract.ExtendedProperties.CONTENT_URI, existing.id.value)
        .asSyncAdapter(account)
    ) > 0
  }

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
