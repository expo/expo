package expo.modules.calendar.next.domain.repositories.extendedproperty

import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.extendedproperty.ExtendedPropertyInput
import expo.modules.calendar.next.domain.model.calendar.CalendarAccount
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.asSyncAdapter
import expo.modules.calendar.next.domain.repositories.safeApplyBatch
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Access to `CalendarContract.ExtendedProperties`, the per-event key/value table.
 *
 * Reads go through the plain URI. Writes go through [asSyncAdapter], because the provider rejects
 * every other caller, and travel in a batch headed by [flagEventOperation].
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
   * already stored under the name before inserting. Everything travels in one batch, which the
   * provider applies as a single transaction: the event is flagged before the rows it covers move,
   * there is no window in which a concurrent write sees no row and inserts a second one, and no
   * half-applied state to repair.
   */
  suspend fun upsert(
    eventId: EventId,
    account: CalendarAccount,
    input: ExtendedPropertyInput
  ): ExtendedPropertyId = withContext(Dispatchers.IO) {
    val syncAdapterUri = CalendarContract.ExtendedProperties.CONTENT_URI.asSyncAdapter(account)
    val results = contentResolver.safeApplyBatch(
      arrayListOf(
        flagEventOperation(eventId),
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
   * Removes every row stored under [name] on the event, in a batch headed by the same flag as
   * [upsert]: what the sync adapter has to push here is the absence of the rows.
   *
   * @return whether at least one row was removed.
   */
  suspend fun deleteByName(
    eventId: EventId,
    account: CalendarAccount,
    name: String
  ): Boolean = withContext(Dispatchers.IO) {
    val syncAdapterUri = CalendarContract.ExtendedProperties.CONTENT_URI.asSyncAdapter(account)
    val results = contentResolver.safeApplyBatch(
      arrayListOf(
        flagEventOperation(eventId),
        ContentProviderOperation.newDelete(syncAdapterUri)
          .withSelection(SELECTION_BY_NAME, selectionArgsByName(eventId, name))
          .build()
      )
    )
    (results.last().count ?: 0) > 0
  }

  /**
   * Builds the update every batch of this repository starts with.
   *
   * The event goes through the plain URI, which buys two things the rows need to reach the server.
   * The provider flags as dirty any event it did not attribute to a sync adapter, so the change
   * made on the sync adapter URI stops looking like one already in sync; and
   * `HAS_EXTENDED_PROPERTIES` tells the sync adapter that the event carries properties worth
   * looking at, without which Google's drops them on the next sync. The flag stays at 1 after a
   * deletion, so the sync adapter still looks at an event whose last property just went away.
   *
   * It is also what makes the operation legal: a batch refuses to carry an update with no value,
   * where [android.content.ContentResolver.update] takes an empty set to flag the event alone.
   */
  private fun flagEventOperation(eventId: EventId): ContentProviderOperation {
    val eventUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId.value)
    return ContentProviderOperation.newUpdate(eventUri)
      .withValue(CalendarContract.Events.HAS_EXTENDED_PROPERTIES, 1)
      .build()
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
