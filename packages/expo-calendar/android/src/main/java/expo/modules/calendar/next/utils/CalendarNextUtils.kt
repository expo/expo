package expo.modules.calendar.next.utils

import android.content.ContentResolver
import android.database.Cursor
import java.util.Calendar
import java.util.TimeZone
import android.content.ContentUris
import android.provider.CalendarContract
import expo.modules.calendar.findEventsQueryParameters
import expo.modules.calendar.next.exceptions.EventDateTimeInvalidException
import java.text.SimpleDateFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}
val rrFormat = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")

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
    val cursor = contentResolver.query(
      uri,
      findEventsQueryParameters,
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
