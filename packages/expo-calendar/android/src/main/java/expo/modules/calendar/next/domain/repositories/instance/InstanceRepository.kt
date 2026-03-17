package expo.modules.calendar.next.domain.repositories.instance

import android.content.ContentResolver
import android.content.ContentUris
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.wrappers.CalendarId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// Instances are read-only on Android and generated on-the-fly based on start/end dates.
// That's why there is no create/update/delete operations. It doesn't contain findById
// because IDs are ephemeral.
class InstanceRepository(private val contentResolver: ContentResolver) {
  suspend fun findAll(
    startDate: Long,
    endDate: Long,
    calendars: List<CalendarId>
  ): List<InstanceEntity> = withContext(Dispatchers.IO) {
    val query = buildSelection(calendars)

    contentResolver.safeQuery(
      uri = CalendarContract.Instances.CONTENT_URI.buildUpon().let { builder ->
        ContentUris.appendId(builder, startDate)
        ContentUris.appendId(builder, endDate)
        builder.build()
      },
      projection = FULL_PROJECTION,
      selection = query.selection,
      selectionArgs = query.selectionArgs,
      sortOrder = "${CalendarContract.Instances.BEGIN} ASC"
    ).use { cursor ->
      cursor.asSequence()
        .map { it.toInstanceEntity() }
        .toList()
    }
  }

  private fun buildSelection(calendarIds: List<CalendarId>): SelectionQuery {
    val visible = "${CalendarContract.Instances.VISIBLE} = 1"

    return if (calendarIds.isNotEmpty()) {
      val placeholders = calendarIds
        .map { it.value.toString() }
        .joinToString(",") { "?" }
      val calendarFilter = "${CalendarContract.Instances.CALENDAR_ID} IN ($placeholders)"
      SelectionQuery(
        selection = "($visible AND $calendarFilter)",
        selectionArgs = calendarIds
          .map { it.value.toString() }
          .toTypedArray()
      )
    } else {
      SelectionQuery(selection = "($visible)", selectionArgs = null)
    }
  }

  private class SelectionQuery(
    val selection: String,
    val selectionArgs: Array<String>?
  )


  companion object {
    val FULL_PROJECTION = arrayOf(
      CalendarContract.Instances._ID,
      CalendarContract.Instances.ACCESS_LEVEL,
      CalendarContract.Instances.ALL_DAY,
      CalendarContract.Instances.AVAILABILITY,
      CalendarContract.Instances.BEGIN,
      CalendarContract.Instances.CALENDAR_ID,
      CalendarContract.Instances.DESCRIPTION,
      CalendarContract.Instances.END,
      CalendarContract.Instances.EVENT_END_TIMEZONE,
      CalendarContract.Instances.EVENT_ID,
      CalendarContract.Instances.EVENT_LOCATION,
      CalendarContract.Instances.EVENT_TIMEZONE,
      CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS,
      CalendarContract.Instances.GUESTS_CAN_MODIFY,
      CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS,
      CalendarContract.Instances.ORGANIZER,
      CalendarContract.Instances.ORIGINAL_ID,
      CalendarContract.Instances.RRULE,
      CalendarContract.Instances.STATUS,
      CalendarContract.Instances.TITLE
    )
  }
}
