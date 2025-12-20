package expo.modules.calendar.next.utils

import android.content.ContentResolver
import android.database.Cursor
import java.util.Calendar
import java.util.TimeZone
import android.content.ContentUris
import android.provider.CalendarContract
import expo.modules.calendar.domain.event.EventRepository
import expo.modules.calendar.next.exceptions.EventDateTimeInvalidException
import java.text.SimpleDateFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Date

val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}
/**
 * [SimpleDateFormat] used in native recurrence rule string.
 * The format corresponds to the 'date-time' type defined by RFC-5455 section 3.3.5.
 */
val rrFormat = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")
/**
 * [SimpleDateFormat] used in native recurrence rule string for all-day events.
 * The format corresponds to the 'date' type defined by RFC-5455 section 3.3.4.
 */
val allDayRRFormat = SimpleDateFormat("yyyyMMdd").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}

/**
 * @param dateString RFC-5455 date or date-time string (RFC sections 3.3.4 and 3.3.5).
 */
fun parseRrDate(dateString: String): Date? =
  runCatching {
    rrFormat.parse(dateString)
  }.recover {
    allDayRRFormat.parse(dateString)
  }.getOrNull()

suspend fun findEvents(contentResolver: ContentResolver, startDate: Any, endDate: Any, calendars: List<String>): Cursor {
  return withContext(Dispatchers.IO) {
    val eStartDate = Calendar.getInstance()
    val eEndDate = Calendar.getInstance()

    setDateInCalendar(eStartDate, startDate)
    setDateInCalendar(eEndDate, endDate)

    val uriBuilder = CalendarContract.Instances.CONTENT_URI.buildUpon()
    ContentUris.appendId(uriBuilder, eStartDate.timeInMillis)
    ContentUris.appendId(uriBuilder, eEndDate.timeInMillis)

    val uri = uriBuilder.build()
    var selection =
      "((${CalendarContract.Instances.BEGIN} >= ${eStartDate.timeInMillis}) " +
        "AND (${CalendarContract.Instances.END} <= ${eEndDate.timeInMillis}) " +
        "AND (${CalendarContract.Instances.VISIBLE} = 1) "

    if (calendars.isNotEmpty()) {
      val calendarQuery = "AND (${calendars.joinToString(" OR ") { "${CalendarContract.Instances.CALENDAR_ID} = '$it'" }})"
      selection += calendarQuery
    }
    selection += ")"

    val sortOrder = "${CalendarContract.Instances.BEGIN} ASC"
    val projection = EventRepository.findEventsQueryParameters
    val cursor = contentResolver.query(
      uri,
      projection,
      selection,
      null,
      sortOrder
    )
    requireNotNull(cursor) { "Cursor shouldn't be null" }
    cursor
  }
}

private fun setDateInCalendar(calendar: Calendar, date: Any) {
  when (date) {
    is String -> {
      val parsedDate = sdf.parse(date)
      if (parsedDate != null) {
        calendar.time = parsedDate
      } else {
        throw EventDateTimeInvalidException("Error parsing date")
      }
    }

    is Number -> {
      calendar.timeInMillis = date.toLong()
    }

    else -> {
      throw EventDateTimeInvalidException("Date has unsupported type")
    }
  }
}
