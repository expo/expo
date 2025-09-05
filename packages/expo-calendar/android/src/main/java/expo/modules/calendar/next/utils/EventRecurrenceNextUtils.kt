package expo.modules.calendar.next.utils

import android.util.Log
import expo.modules.calendar.CalendarModule.Companion.TAG
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.core.arguments.ReadableArguments
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.TimeZone

val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
  timeZone = TimeZone.getTimeZone("GMT")
}

val rrFormat = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")

fun extractRecurrence(recurrenceRule: ReadableArguments): RecurrenceRuleRecord {
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
    val endDateObj = recurrenceRule["endDate"]
    if (endDateObj is String) {
      val parsedDate = dateFormat.parse(endDateObj)
      if (parsedDate != null) {
        endDate = rrFormat.format(parsedDate)
      } else {
        Log.e(TAG, "endDate is null")
      }
    } else if (endDateObj is Number) {
      val calendar = Calendar.getInstance()
      calendar.timeInMillis = endDateObj.toLong()
      endDate = rrFormat.format(calendar.time)
    }
  }
  return RecurrenceRuleRecord(endDate, frequency, interval, occurrence)
}

fun createRecurrenceRule(opts: RecurrenceRuleRecord): String {
  val (endDate, frequency, interval, occurrence) = opts
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
