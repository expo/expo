package expo.modules.calendar.next.domain.model.event

import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.CalendarUtils.recurrenceRuleSDF
import java.util.Date
import java.util.Locale

data class RecurrenceRule(
  val frequency: String,
  val interval: Int?,
  val occurrence: Int?,
  val endDate: String?,
  val daysOfTheWeek: List<RecurrenceWeekday>? = null,
  val daysOfTheMonth: List<Int>? = null,
  val monthsOfTheYear: List<Int>? = null
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

    daysOfTheWeek?.takeIf { it.isNotEmpty() }?.let {
      rrule += ";BYDAY=" + it.joinToString(",") { day -> day.toRuleString() }
    }
    daysOfTheMonth?.takeIf { it.isNotEmpty() }?.let {
      require(it.all { day -> day in -31..31 && day != 0 })
      rrule += ";BYMONTHDAY=" + it.joinToString(",")
    }
    monthsOfTheYear?.takeIf { it.isNotEmpty() }?.let {
      require(it.all { month -> month in 1..12 })
      rrule += ";BYMONTH=" + it.joinToString(",")
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

      return RecurrenceRule(
        frequency, interval, occurrence, endDate,
        ruleParts["BYDAY"]?.split(",")?.map(RecurrenceWeekday::fromRuleString),
        ruleParts["BYMONTHDAY"]?.split(",")?.map(String::toInt),
        ruleParts["BYMONTH"]?.split(",")?.map(String::toInt)
      )
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

/** Expo numbers weekdays Sunday=1 through Saturday=7, matching EventKit. */
data class RecurrenceWeekday(val dayOfTheWeek: Int, val weekNumber: Int? = null) {
  fun toRuleString(): String {
    require(dayOfTheWeek in 1..7)
    require(weekNumber == null || weekNumber in -53..53)
    val ordinal = weekNumber?.takeIf { it != 0 }?.toString() ?: ""
    return ordinal + names[dayOfTheWeek - 1]
  }

  companion object {
    private val weekdayPattern = Regex("([+-]?[0-9]+)?(SU|MO|TU|WE|TH|FR|SA)", RegexOption.IGNORE_CASE)
    private val names = listOf("SU", "MO", "TU", "WE", "TH", "FR", "SA")

    fun fromRuleString(value: String): RecurrenceWeekday {
      val match = weekdayPattern.matchEntire(value)
        ?: throw IllegalArgumentException("Invalid recurrence weekday")
      return RecurrenceWeekday(names.indexOf(match.groupValues[2].uppercase(Locale.ROOT)) + 1, match.groupValues[1].toIntOrNull())
    }
  }
}
