package expo.modules.calendar.next.utils

import java.util.TimeZone
import java.text.SimpleDateFormat
import java.util.Date

val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}

/**
 * [SimpleDateFormat] used in native recurrence rule string.
 * The format corresponds to the 'date-time' type defined by RFC-5455 section 3.3.5.
 */
val rrFormat = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}

/**
 * [SimpleDateFormat] used in native recurrence rule string for all-day events.
 * The format corresponds to the 'date' type defined by RFC-5455 section 3.3.4.
 */
val allDayRrFormat = SimpleDateFormat("yyyyMMdd").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}

/**
 * @param dateString RFC-5455 date or date-time string (RFC sections 3.3.4 and 3.3.5).
 */
fun parseRrDate(dateString: String): Date? =
  runCatching {
    rrFormat.parse(dateString)
  }.recover {
    allDayRrFormat.parse(dateString)
  }.getOrNull()
