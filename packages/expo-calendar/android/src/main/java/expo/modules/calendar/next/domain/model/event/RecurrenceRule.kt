package expo.modules.calendar.next.domain.model.event

import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.CalendarUtils.recurrenceRuleSDF
import java.util.Date
import java.util.Locale

data class RecurrenceRule(
  val frequency: String,
  val interval: Int?,
  val occurrence: Int?,
  val endDate: String?
) {

  /**
   * @return A string defined by RFC 5455 section 3.3.10
   */
  fun toRuleString(): String {
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

    val until = ruleEndDate()
    if (until != null) {
      rrule += ";UNTIL=$until"
    } else if (occurrence != null) {
      rrule += ";COUNT=$occurrence"
    }

    return rrule
  }

  private fun ruleEndDate(): String? {
    val date = endDate?.let { runCatching { CalendarUtils.sdf.parse(it) }.getOrNull() }
      ?: return null
    return recurrenceRuleSDF.format(date)
  }

  companion object {
    /**
     * @param rrule A string defined by RFC 5455 section 3.3.10
     */
    fun fromRuleString(rrule: String): RecurrenceRule {
      val ruleParts = rrule.split(";").associate {
        val (name, value) = it.split("=")
        Pair(name, value)
      }

      val frequency = requireNotNull(ruleParts["FREQ"])
        .lowercase(Locale.getDefault())

      val interval = ruleParts["INTERVAL"]?.toInt()

      var occurrence: Int? = null
      var endDate: String? = null

      if (ruleParts.contains("UNTIL")) {
        endDate = ruleParts["UNTIL"]
          ?.let { tryParseEndDate(it) }
          ?.let { CalendarUtils.sdf.format(it) }
      } else if (ruleParts.contains("COUNT")) {
        occurrence = ruleParts["COUNT"]?.toInt()
      }

      return RecurrenceRule(frequency, interval, occurrence, endDate)
    }
  }
}

/**
 * @param endDate RFC-5455 date or date-time string (RFC sections 3.3.4 and 3.3.5).
 */
private fun tryParseEndDate(endDate: String): Date? =
  runCatching {
    CalendarUtils.recurrenceRuleSDF.parse(endDate)
  }.recover {
    CalendarUtils.allDayRecurrenceSDF.parse(endDate)
  }.getOrNull()
