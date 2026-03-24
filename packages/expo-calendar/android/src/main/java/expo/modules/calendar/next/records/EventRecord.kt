package expo.modules.calendar.next.records

import expo.modules.calendar.next.utils.parseRrDate
import expo.modules.calendar.next.utils.rrFormat
import expo.modules.calendar.next.utils.sdf
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import java.util.Locale

data class EventInputRecord(
  @Field val startDate: String,
  @Field val endDate: String,
  @Field val title: String? = null,
  @Field val location: String? = null,
  @Field val timeZone: String? = null,
  @Field val endTimeZone: String? = null,
  @Field val notes: String? = null,
  @Field val alarms: List<AlarmRecord>? = null,
  @Field val recurrenceRule: RecurrenceRuleRecord? = null,
  @Field val allDay: Boolean? = null,
  @Field val availability: EventAvailability? = null,
  @Field val status: EventStatus? = null,
  @Field val organizerEmail: String? = null,
  @Field val accessLevel: EventAccessLevel? = null,
  @Field val guestsCanModify: Boolean? = null,
  @Field val guestsCanInviteOthers: Boolean? = null,
  @Field val guestsCanSeeGuests: Boolean? = null,
  @Field val originalId: String? = null,
  @Field val instanceId: String? = null
) : Record

data class AlarmRecord(
  @Field
  val relativeOffset: Int?,
  @Field
  val method: AlarmMethod?
) : Record

data class RecurrenceRuleRecord(
  @Field
  val endDate: String? = null,
  @Field
  val frequency: String? = null,
  @Field
  val interval: Int? = null,
  @Field
  val occurrence: Int? = null
) : Record {

  /**
   * Returns the endDate in RRULE format, or null if endDate is null or invalid.
   */
  fun toRrFormat(): RecurrenceRuleRecord? {
    val endDate = endDate ?: return this
    val parseDate = sdf.parse(endDate) ?: return this
    return copy(endDate = rrFormat.format(parseDate))
  }
  companion object {
    fun fromRrFormat(rrule: String?): RecurrenceRuleRecord? {
      if (rrule.isNullOrBlank()) {
        return null
      }
      val ruleMap = rrule
        .split(";")
        .mapNotNull { part ->
          val keyValue = part.split("=")
          if (keyValue.size != 2) {
            return@mapNotNull null
          }
          keyValue[0].uppercase(Locale.getDefault()) to keyValue[1]
        }
        .toMap()

      return RecurrenceRuleRecord(
        endDate = ruleMap["UNTIL"]
          ?.takeIf { it.isNotBlank() }
          ?.let { parseRrDate(it) }
          ?.let { sdf.format(it) },
        frequency = ruleMap["FREQ"]?.lowercase(Locale.getDefault()),
        interval = ruleMap["INTERVAL"]?.toIntOrNull(),
        occurrence = ruleMap["COUNT"]?.toIntOrNull()
      )
    }
  }
}

data class RecurringEventOptions(
  @Field
  val instanceStartDate: String? = null,
  @Field
  var futureEvents: Boolean? = false
) : Record

enum class EventAvailability(val value: String) : Enumerable {
  BUSY("busy"),
  FREE("free"),
  TENTATIVE("tentative")
}

enum class EventStatus(val value: String) : Enumerable {
  CONFIRMED("confirmed"),
  TENTATIVE("tentative"),
  CANCELED("canceled")
}

enum class EventAccessLevel(val value: String) : Enumerable {
  CONFIDENTIAL("confidential"),
  PRIVATE("private"),
  PUBLIC("public"),
  DEFAULT("default")
}

enum class AlarmMethod(val value: String) : Enumerable {
  ALARM("alarm"),
  ALERT("alert"),
  EMAIL("email"),
  SMS("sms"),
  DEFAULT("default")
}
