package expo.modules.calendar.domain.event.records

import expo.modules.calendar.CalendarUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.Date
import java.util.Locale

data class RecurrenceRuleEntity(
  @Field val frequency: String,
  @Field val interval: Int?,
  @Field val occurrence: Int?,
  @Field val endDate: String?
) : Record {
  companion object {
    /**
     * @param rrule A string defined by RFC 5455 section 3.3.10
     */
    fun fromRuleString(rrule: String): RecurrenceRuleEntity {
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

      return RecurrenceRuleEntity(frequency, interval, occurrence, endDate)
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
