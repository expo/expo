package expo.modules.calendar.domain.event.records

import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.CalendarUtils.recurrenceRuleSDF
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.text.ParseException
import java.util.Locale

data class RecurrenceRuleEntity(
  @Field val frequency: String,
  @Field val interval: Int?,
  @Field val occurrence: Int?,
  @Field val endDate: String?
) : Record {
  companion object {
    fun fromRuleString(rrule: String): RecurrenceRuleEntity {
      val recurrenceRules = rrule.split(";")

      val frequency = recurrenceRules[0]
        .split("=")[1]
        .lowercase(Locale.getDefault())

      val interval = recurrenceRules.getOrNull(1)?.let {
        val (name, value) = it.split("=")
        value.takeIf { name == "INTERVAL" }?.toInt()
      }

      var occurrence: Int? = null
      var endDate: String? = null

      val terminationRules = recurrenceRules
        .getOrNull(2)
        ?.split("=")
        ?.takeIf { it.size >= 2 }

      if (terminationRules != null) {
        val (ruleName, ruleValue) = terminationRules
        if (ruleName == "UNTIL") {
          endDate = try {
            recurrenceRuleSDF.parse(ruleValue)?.let {
              CalendarUtils.sdf.format(it)
            }
          } catch (_: ParseException) {
            null
          }
        } else if (ruleName == "COUNT") {
          occurrence = ruleValue.toInt()
        }
      }

      return RecurrenceRuleEntity(frequency, interval, occurrence, endDate)
    }
  }
}
