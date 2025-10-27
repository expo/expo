package expo.modules.calendar.domain.calendar

import android.content.ContentUris
import android.content.Context
import android.provider.CalendarContract
import expo.modules.calendar.domain.calendar.extensions.extractCalendar
import expo.modules.calendar.domain.calendar.records.CalendarEntity
import expo.modules.calendar.domain.calendar.records.input.CalendarUpdateInput
import expo.modules.calendar.domain.calendar.records.input.NewCalendarInput
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

class CalendarRepository(context: Context) {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef.get()?.contentResolver ?: throw Exceptions.ReactContextLost()

  @Throws(SecurityException::class)
  suspend fun findCalendars(): List<CalendarEntity> = withContext(Dispatchers.IO) {
    val uri = CalendarContract.Calendars.CONTENT_URI
    val cursor = contentResolver.query(uri, findCalendarsQueryParameters, null, null, null)
    requireNotNull(cursor) { "Cursor shouldn't be null" }

    return@withContext cursor.use { cursor ->
      val results = mutableListOf<CalendarEntity>()
      while (cursor.moveToNext()) {
        results.add(cursor.extractCalendar())
      }
      results
    }
  }

  suspend fun findCalendarById(calendarID: String): CalendarEntity? = withContext(Dispatchers.IO) {
    val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toInt().toLong())
    val cursor = contentResolver.query(
      uri,
      findCalendarByIdQueryFields,
      null,
      null,
      null
    )
    requireNotNull(cursor) { "Cursor shouldn't be null" }
    return@withContext cursor.use { cursor ->
      cursor.takeIf { it.moveToFirst() }?.extractCalendar()
    }
  }

  suspend fun createCalendar(calendarInput: NewCalendarInput): Int {
    val uriBuilder = CalendarContract.Calendars.CONTENT_URI
      .buildUpon()
      .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
      .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, calendarInput.source.name)
      .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, calendarInput.source.resolvedType)

    val calendarsUri = uriBuilder.build()
    val calendarUri = withContext(Dispatchers.IO) {
      contentResolver.insert(calendarsUri, calendarInput.toContentValues())
    }
    return calendarUri!!.lastPathSegment!!.toInt()
  }

  suspend fun updateCalendar(updateInput: CalendarUpdateInput): Int {
    val calendarID = updateInput.id.toInt()
    val updateUri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toLong())
    withContext(Dispatchers.IO) {
      contentResolver.update(updateUri, updateInput.toContentValues(), null, null)
    }
    return calendarID
  }

  @Throws(SecurityException::class)
  suspend fun deleteCalendar(calendarId: String): Boolean {
    val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarId.toInt().toLong())
    val rows = withContext(Dispatchers.IO) {
      contentResolver.delete(uri, null, null)
    }
    return rows > 0
  }

  companion object {
    val findCalendarByIdQueryFields = arrayOf(
      CalendarContract.Calendars._ID,
      CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
      CalendarContract.Calendars.ACCOUNT_NAME,
      CalendarContract.Calendars.IS_PRIMARY,
      CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
      CalendarContract.Calendars.ALLOWED_AVAILABILITY,
      CalendarContract.Calendars.NAME,
      CalendarContract.Calendars.ACCOUNT_TYPE,
      CalendarContract.Calendars.CALENDAR_COLOR,
      CalendarContract.Calendars.OWNER_ACCOUNT,
      CalendarContract.Calendars.CALENDAR_TIME_ZONE,
      CalendarContract.Calendars.ALLOWED_REMINDERS,
      CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
      CalendarContract.Calendars.VISIBLE,
      CalendarContract.Calendars.SYNC_EVENTS
    )

    val findCalendarsQueryParameters = arrayOf(
      CalendarContract.Calendars._ID,
      CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
      CalendarContract.Calendars.ACCOUNT_NAME,
      CalendarContract.Calendars.IS_PRIMARY,
      CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
      CalendarContract.Calendars.ALLOWED_AVAILABILITY,
      CalendarContract.Calendars.NAME,
      CalendarContract.Calendars.ACCOUNT_TYPE,
      CalendarContract.Calendars.CALENDAR_COLOR,
      CalendarContract.Calendars.OWNER_ACCOUNT,
      CalendarContract.Calendars.CALENDAR_TIME_ZONE,
      CalendarContract.Calendars.ALLOWED_REMINDERS,
      CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
      CalendarContract.Calendars.VISIBLE,
      CalendarContract.Calendars.SYNC_EVENTS
    )
  }
}
