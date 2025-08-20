package expo.modules.calendar.next

import expo.modules.calendar.CalendarUtils
import java.util.Calendar
import java.util.Date

object CalendarNextUtils {
  val sdf = CalendarUtils.sdf

  fun dateToMilliseconds(stringValue: String?): Long? {
    if (stringValue == null) return null
    try {
      val cal = Calendar.getInstance()
      val parsedDate = sdf.parse(stringValue)
      cal.time = parsedDate ?: return null
      return cal.timeInMillis
    } catch (e: Exception) {
      return null
    }
  }

  fun dateToString(longValue: Long?): String? {
    if (longValue == null) return null
    val cal = Calendar.getInstance()
    cal.timeInMillis = longValue
    return sdf.format(cal.time)
  }
}
