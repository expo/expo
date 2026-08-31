package expo.modules.calendar.next.domain.repositories.extendedproperty

import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.extendedproperty.ExtendedPropertyInput
import expo.modules.calendar.next.domain.model.calendar.CalendarAccount
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.asSyncAdapter
import expo.modules.calendar.next.domain.repositories.safeApplyBatch
import expo.modules.calendar.next.domain.repositories.safeDelete
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Access to `CalendarContract.ExtendedProperties`, the per-event key/value table.
 *
 * Reads go through the plain URI. Writes go through [asSyncAdapter], because the provider rejects
 * every other caller.
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
   * Writes [input] on the event, leaving exactly one row under that name.
   *
   * The table has no unique constraint on (`EVENT_ID`, `NAME`), so the write removes what is
   * already stored under the name before inserting. Both operations travel in one batch, which the
   * provider applies as a single transaction: no window in which a concurrent write sees no row
   * and inserts a second one, and no half-applied state to repair.
   */
  suspend fun upsert(
    eventId: EventId,
    account: CalendarAccount,
    input: ExtendedPropertyInput
  ): ExtendedPropertyId = withContext(Dispatchers.IO) {
    val syncAdapterUri = CalendarContract.ExtendedProperties.CONTENT_URI.asSyncAdapter(account)
    val results = contentResolver.safeApplyBatch(
      arrayListOf(
        ContentProviderOperation.newDelete(syncAdapterUri)
          .withSelection(SELECTION_BY_NAME, selectionArgsByName(eventId, input.name))
          .build(),
        ContentProviderOperation.newInsert(syncAdapterUri)
          .withValues(input.toContentValues(eventId))
          .build()
      )
    )
    ExtendedPropertyId(
      results.last().uri?.lastPathSegment?.toLongOrNull()
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
    contentResolver.safeDelete(
      uri = CalendarContract.ExtendedProperties.CONTENT_URI.asSyncAdapter(account),
      where = SELECTION_BY_NAME,
      selectionArgs = selectionArgsByName(eventId, name)
    ) > 0
  }

  private fun selectionArgsByName(eventId: EventId, name: String) =
    arrayOf(eventId.value.toString(), name)

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

    private const val SELECTION_BY_NAME =
      "${CalendarContract.ExtendedProperties.EVENT_ID} = ? AND ${CalendarContract.ExtendedProperties.NAME} = ?"
  }
}
