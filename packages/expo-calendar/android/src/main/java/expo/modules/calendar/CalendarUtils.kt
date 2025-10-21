package expo.modules.calendar

import java.text.SimpleDateFormat
import java.util.TimeZone

internal object CalendarUtils {
  /**
   * [SimpleDateFormat] used when passing data to/from JS
   */
  val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
    timeZone = TimeZone.getTimeZone("GMT")
  }

  /**
   * [SimpleDateFormat] used in native recurrence rule string.
   * The format corresponds to the 'date-time' type defined by RFC-5455 section 3.3.5.
   */
  val recurrenceRuleSDF = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'").apply {
    timeZone = TimeZone.getTimeZone("GMT")
  }

  /**
   * [SimpleDateFormat] used in native recurrence rule string for all-day events.
   * The format corresponds to the 'date' type defined by RFC-5455 section 3.3.4.
   */
  val allDayRecurrenceSDF = SimpleDateFormat("yyyyMMdd").apply {
    timeZone = TimeZone.getTimeZone("GMT")
  }
}
