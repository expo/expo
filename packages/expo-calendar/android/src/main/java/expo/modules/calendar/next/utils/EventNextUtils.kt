package expo.modules.calendar.next.utils

import expo.modules.calendar.next.records.RecurrenceRuleRecord

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
