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
   */
  val recurrenceRuleSDF = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")
}
