package expo.modules.calendar.next.records

import android.provider.CalendarContract
import expo.modules.calendar.accessConstantMatchingString
import expo.modules.calendar.availabilityConstantMatchingString
import expo.modules.calendar.next.utils.rrFormat
import expo.modules.calendar.next.utils.sdf
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import java.util.Locale

data class EventRecord(
  @Field
  val id: String? = null,
  @Field
  val calendarId: String? = null,
  @Field
  val title: String? = null,
  @Field
  val location: String? = null,
  @Field
  val timeZone: String? = null,
  @Field
  val endTimeZone: String? = null,
  @Field
  val notes: String? = null,
  @Field
  val alarms: List<AlarmRecord>? = null,
  @Field
  val recurrenceRule: RecurrenceRuleRecord? = null,
  @Field
  val startDate: String? = null,
  @Field
  val endDate: String? = null,
  @Field
  val allDay: Boolean? = null,
  @Field
  val availability: EventAvailability? = null,
  @Field
  val status: EventStatus? = null,
  @Field
  val organizerEmail: String? = null,
  @Field
  val accessLevel: EventAccessLevel? = null,
  @Field
  val guestsCanModify: Boolean? = null,
  @Field
  val guestsCanInviteOthers: Boolean? = null,
  @Field
  val guestsCanSeeGuests: Boolean? = null,
  @Field
  val originalId: String? = null,
  @Field
  val instanceId: String? = null,
) : Record

data class AlarmRecord(
  @Field
  val relativeOffset: Int?,
  @Field
  val method: AlarmMethod?,
) : Record

data class RecurrenceRuleRecord(
  @Field
  val endDate: String? = null,
  @Field
  val frequency: String? = null,
  @Field
  val interval: Int? = null,
  @Field
  val occurrence: Int? = null,
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
          ?.let { rrFormat.parse(it) }
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
  TENTATIVE("tentative");

  fun toAndroidValue(availability: EventAvailability?): Int? {
    return availability?.value?.let { availabilityConstantMatchingString(it) }
  }

  companion object {
    fun fromAndroidValue(value: Int?): EventAvailability = when (value) {
      CalendarContract.Events.AVAILABILITY_BUSY -> BUSY
      CalendarContract.Events.AVAILABILITY_FREE -> FREE
      CalendarContract.Events.AVAILABILITY_TENTATIVE -> TENTATIVE
      else -> BUSY
    }
  }
}

enum class EventStatus(val value: String) : Enumerable {
  CONFIRMED("confirmed"),
  TENTATIVE("tentative"),
  CANCELED("canceled");

  fun toAndroidValue(status: EventStatus?): Int = when (status) {
    CONFIRMED -> CalendarContract.Events.STATUS_CONFIRMED
    TENTATIVE -> CalendarContract.Events.STATUS_TENTATIVE
    CANCELED -> CalendarContract.Events.STATUS_CANCELED
    else -> CalendarContract.Events.STATUS_CANCELED
  }

  companion object {
    fun fromAndroidValue(value: Int): EventStatus = when (value) {
      CalendarContract.Events.STATUS_CONFIRMED -> CONFIRMED
      CalendarContract.Events.STATUS_TENTATIVE -> TENTATIVE
      CalendarContract.Events.STATUS_CANCELED -> CANCELED
      else -> CANCELED
    }
  }
}

enum class EventAccessLevel(val value: String) : Enumerable {
  CONFIDENTIAL("confidential"),
  PRIVATE("private"),
  PUBLIC("public"),
  DEFAULT("default");

  fun toAndroidValue(accessLevel: EventAccessLevel?): Int? {
    return accessLevel?.value?.let { accessConstantMatchingString(it) }
  }

  companion object {
    fun fromAndroidValue(value: Int): EventAccessLevel = when (value) {
      CalendarContract.Events.ACCESS_CONFIDENTIAL -> CONFIDENTIAL
      CalendarContract.Events.ACCESS_PRIVATE -> PRIVATE
      CalendarContract.Events.ACCESS_PUBLIC -> PUBLIC
      CalendarContract.Events.ACCESS_DEFAULT -> DEFAULT
      else -> DEFAULT
    }
  }
}

enum class AlarmMethod(val value: String) : Enumerable {
  ALARM("alarm"),
  ALERT("alert"),
  EMAIL("email"),
  SMS("sms"),
  DEFAULT("default");

  fun toAndroidValue(): Int = when (this) {
    ALERT -> CalendarContract.Reminders.METHOD_ALERT
    ALARM -> CalendarContract.Reminders.METHOD_ALARM
    EMAIL -> CalendarContract.Reminders.METHOD_EMAIL
    SMS -> CalendarContract.Reminders.METHOD_SMS
    else -> CalendarContract.Reminders.METHOD_DEFAULT
  }

  companion object {
    fun fromAndroidValue(value: Int): AlarmMethod = when (value) {
      CalendarContract.Reminders.METHOD_ALARM -> ALARM
      CalendarContract.Reminders.METHOD_ALERT -> ALERT
      CalendarContract.Reminders.METHOD_EMAIL -> EMAIL
      CalendarContract.Reminders.METHOD_SMS -> SMS
      CalendarContract.Reminders.METHOD_DEFAULT -> DEFAULT
      else -> DEFAULT
    }

    fun fromReminderString(remindersString: String?): List<AlarmMethod> {
      return remindersString
        ?.split(",")
        ?.filter { it.isNotBlank() }
        ?.map { reminderString ->
          entries.find { it.value == reminderString } ?: DEFAULT
        } ?: emptyList()
    }
  }
}
