package expo.modules.calendar.next.domain.repositories.calendar

import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.calendar.CalendarInput
import expo.modules.calendar.next.domain.dto.calendar.CalendarUpdate
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.repositories.asSequence
import expo.modules.calendar.next.domain.repositories.safeDelete
import expo.modules.calendar.next.domain.repositories.safeInsert
import expo.modules.calendar.next.domain.repositories.safeQuery
import expo.modules.calendar.next.domain.repositories.safeUpdate
import expo.modules.calendar.next.domain.wrappers.CalendarId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CalendarRepository(private val contentResolver: ContentResolver) {
  suspend fun findAll(): List<CalendarEntity> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = CalendarContract.Calendars.CONTENT_URI,
      projection = FULL_PROJECTION
    ).use { cursor ->
      cursor.asSequence()
        .map { it.toCalendarEntity() }
        .toList()
    }
  }

  suspend fun findById(id: CalendarId): CalendarEntity? = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, id.value),
      projection = FULL_PROJECTION
    ).use { cursor ->
      cursor.takeIf { it.moveToFirst() }
        ?.toCalendarEntity()
    }
  }

  suspend fun insert(calendarInput: CalendarInput): CalendarId = withContext(Dispatchers.IO) {
    val calendarUri = contentResolver.safeInsert(
      uri = CalendarContract.Calendars.CONTENT_URI.buildUpon()
        .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
        .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, calendarInput.accountName)
        .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, calendarInput.accountType)
        .build(),
      values = calendarInput.toContentValues()
    )
    val calendarId = requireNotNull(calendarUri.lastPathSegment) {
      "Couldn't decode calendar ID from inserted content URI"
    }
    CalendarId(
      calendarId.toLongOrNull()
        ?: throw IllegalStateException("Couldn't parse calendar ID: $calendarId")
    )
  }

  suspend fun update(id: CalendarId, calendarUpdate: CalendarUpdate): Boolean = withContext(Dispatchers.IO) {
    contentResolver.safeUpdate(
      uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, id.value),
      values = calendarUpdate.toContentValues()
    ) > 0
  }

  suspend fun delete(id: CalendarId): Boolean = withContext(Dispatchers.IO) {
    contentResolver.safeDelete(
      uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, id.value)
    ) > 0
  }

  private fun CalendarInput.toContentValues() = ContentValues().apply {
    put(CalendarContract.Calendars.NAME, name)
    put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, calendarDisplayName)
    put(CalendarContract.Calendars.VISIBLE, visible)
    put(CalendarContract.Calendars.SYNC_EVENTS, syncEvents)
    put(CalendarContract.Calendars.ACCOUNT_NAME, accountName)
    put(CalendarContract.Calendars.ACCOUNT_TYPE, accountType)
    put(CalendarContract.Calendars.CALENDAR_COLOR, calendarColor)
    put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, calendarAccessLevel?.value)
    put(CalendarContract.Calendars.OWNER_ACCOUNT, ownerAccount)
    put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, calendarTimeZone)
    put(
      CalendarContract.Calendars.ALLOWED_REMINDERS,
      allowedReminders.takeIf { it.isNotEmpty() }
        ?.joinToString(",") { it.value.toString() }
    )
    put(
      CalendarContract.Calendars.ALLOWED_AVAILABILITY,
      allowedAvailability.takeIf { it.isNotEmpty() }
        ?.joinToString(",") { it.value.toString() }
    )
    put(
      CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
      allowedAttendeeTypes.takeIf { it.isNotEmpty() }
        ?.joinToString(",") { it.value.toString() }
    )
  }

  private fun CalendarUpdate.toContentValues() = ContentValues().apply {
    if (!name.isUndefined) {
      put(CalendarContract.Calendars.NAME, name.optional)
    }
    if (!calendarDisplayName.isUndefined) {
      put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, calendarDisplayName.optional)
    }
    if (!calendarColor.isUndefined) {
      put(CalendarContract.Calendars.CALENDAR_COLOR, calendarColor.optional)
    }
    if (!visible.isUndefined) {
      put(CalendarContract.Calendars.VISIBLE, visible.optional)
    }
    if (!syncEvents.isUndefined) {
      put(CalendarContract.Calendars.SYNC_EVENTS, syncEvents.optional)
    }
    if (!calendarTimeZone.isUndefined) {
      put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, calendarTimeZone.optional)
    }
  }

  companion object {
    private val FULL_PROJECTION = arrayOf(
      CalendarContract.Calendars._ID,
      CalendarContract.Calendars.ACCOUNT_NAME,
      CalendarContract.Calendars.ACCOUNT_TYPE,
      CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
      CalendarContract.Calendars.ALLOWED_AVAILABILITY,
      CalendarContract.Calendars.ALLOWED_REMINDERS,
      CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
      CalendarContract.Calendars.CALENDAR_COLOR,
      CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
      CalendarContract.Calendars.CALENDAR_TIME_ZONE,
      CalendarContract.Calendars.IS_PRIMARY,
      CalendarContract.Calendars.NAME,
      CalendarContract.Calendars.OWNER_ACCOUNT,
      CalendarContract.Calendars.SYNC_EVENTS,
      CalendarContract.Calendars.VISIBLE
    )
  }
}
