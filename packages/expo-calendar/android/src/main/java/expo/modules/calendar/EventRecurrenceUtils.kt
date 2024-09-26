package expo.modules.calendar

import android.util.Log
import expo.modules.calendar.CalendarModule.Companion.TAG
import expo.modules.core.arguments.ReadableArguments
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.TimeZone

data class Recurrence(
  val frequency: String,
  val interval: Int?,
  val endDate: String?,
  val occurrence: Int?
)

object EventRecurrenceUtils {

  val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
    timeZone = TimeZone.getTimeZone("GMT")
  }

  fun extractRecurrence(recurrenceRule: ReadableArguments): Recurrence {
    val frequency = recurrenceRule.getString("frequency")
    val interval: Int? = if (recurrenceRule.containsKey("interval")) {
      recurrenceRule.getInt("interval")
    } else {
      null
    }
    val occurrence: Int? = if (recurrenceRule.containsKey("occurrence")) {
      recurrenceRule.getInt("occurrence")
    } else {
      null
    }
    var endDate: String? = null

    if (recurrenceRule.containsKey("endDate")) {
      val format = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")
      val endDateObj = recurrenceRule["endDate"]
      if (endDateObj is String) {
        val parsedDate = dateFormat.parse(endDateObj)
        if (parsedDate != null) {
          endDate = format.format(parsedDate)
        } else {
          Log.e(TAG, "endDate is null")
        }
      } else if (endDateObj is Number) {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = endDateObj.toLong()
        endDate = format.format(calendar.time)
      }
    }
    return Recurrence(frequency, interval, endDate, occurrence)
  }

  fun createRecurrenceRule(opts: Recurrence): String {
    val (frequency, interval, endDate, occurrence) = opts
    var rrule: String = when (frequency) {
      "daily" -> "FREQ=DAILY"
      "weekly" -> "FREQ=WEEKLY"
      "monthly" -> "FREQ=MONTHLY"
      "yearly" -> "FREQ=YEARLY"
      else -> ""
    }
    if (interval != null) {
      rrule += ";INTERVAL=$interval"
    }
    if (endDate != null) {
      rrule += ";UNTIL=$endDate"
    } else if (occurrence != null) {
      rrule += ";COUNT=$occurrence"
    }
    return rrule
  }
}
