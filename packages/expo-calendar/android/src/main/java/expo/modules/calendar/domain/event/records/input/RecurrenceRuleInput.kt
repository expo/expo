package expo.modules.calendar.domain.event.records.input

import expo.modules.calendar.CalendarUtils.recurrenceRuleSDF
import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.extensions.getTimeInMillis
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.Calendar

@OptIn(EitherType::class)
data class RecurrenceRuleInput(
  @Field val frequency: String = "",
  @Field val interval: Int? = null,
  @Field val occurrence: Int? = null,
  @Field val endDate: DateTimeInput? = null
) : Record {
  private fun ruleEndDate(): String? {
    val inputDate = endDate?.getTimeInMillis() ?: return null

    val calendar = Calendar.getInstance().apply {
      timeInMillis = inputDate
    }
    return recurrenceRuleSDF.format(calendar.time)
  }

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
}
