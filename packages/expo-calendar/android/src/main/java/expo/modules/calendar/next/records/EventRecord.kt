package expo.modules.calendar.next.records

import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils.sdf
import expo.modules.calendar.accessConstantMatchingString
import expo.modules.calendar.availabilityConstantMatchingString
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

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
) : Record {
  fun getUpdatedRecord(other: EventRecord, nullableFields: List<String>? = null): EventRecord {
    val nullableSet = nullableFields?.toSet() ?: emptySet()

    return EventRecord(
      id = if ("id" in nullableSet) null else other.id ?: this.id,
      calendarId = if ("calendarId" in nullableSet) null else other.calendarId ?: this.calendarId,
      title = if ("title" in nullableSet) null else other.title ?: this.title,
      location = if ("location" in nullableSet) null else other.location ?: this.location,
      timeZone = if ("timeZone" in nullableSet) null else other.timeZone ?: this.timeZone,
      alarms = if ("alarms" in nullableSet) null else other.alarms ?: this.alarms,
      endTimeZone = if ("endTimeZone" in nullableSet) null else other.endTimeZone
        ?: this.endTimeZone,
      notes = if ("notes" in nullableSet) null else other.notes ?: this.notes,
      recurrenceRule = if ("recurrenceRule" in nullableSet) null else other.recurrenceRule
        ?: this.recurrenceRule,
      startDate = if ("startDate" in nullableSet) null else other.startDate ?: this.startDate,
      endDate = if ("endDate" in nullableSet) null else other.endDate ?: this.endDate,
      allDay = if ("allDay" in nullableSet) null else other.allDay ?: this.allDay,
      availability = if ("availability" in nullableSet) null else other.availability
        ?: this.availability,
      status = if ("status" in nullableSet) null else other.status ?: this.status,
      organizerEmail = if ("organizerEmail" in nullableSet) null else other.organizerEmail
        ?: this.organizerEmail,
      accessLevel = if ("accessLevel" in nullableSet) null else other.accessLevel
        ?: this.accessLevel,
      guestsCanModify = if ("guestsCanModify" in nullableSet) null else other.guestsCanModify
        ?: this.guestsCanModify,
      guestsCanInviteOthers = if ("guestsCanInviteOthers" in nullableSet) null else other.guestsCanInviteOthers
        ?: this.guestsCanInviteOthers,
      guestsCanSeeGuests = if ("guestsCanSeeGuests" in nullableSet) null else other.guestsCanSeeGuests
        ?: this.guestsCanSeeGuests,
      originalId = if ("originalId" in nullableSet) null else other.originalId ?: this.originalId,
    )
  }
}

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
    if (endDate == null) return this
    return try {
      val rrFormat = java.text.SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")
      val date = sdf.parse(endDate)
      if (date != null) {
        return RecurrenceRuleRecord(
          endDate = rrFormat.format(date),
          frequency = frequency,
          interval = interval,
          occurrence = occurrence,
        )
      } else this
    } catch (e: Exception) {
      this
    }
  }
}

data class RecurringEventOptions(
  @Field
  val instanceStartDate: String? = null,
) : Record

enum class EventAvailability(val value: String) : Enumerable {
  BUSY("busy"),
  FREE("free"),
  TENTATIVE("tentative"),

  // iOS only, not supported on Android:
  NOT_SUPPORTED("notSupported"),
  UNAVAILABLE("unavailable");

  fun toAndroidValue(availability: EventAvailability?): Int? {
    return availability?.value?.let { availabilityConstantMatchingString(it) }
  }

  companion object {
    fun fromAndroidValue(value: Int): EventAvailability? = when (value) {
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
  CANCELED("canceled"),

  // iOS only, not supported on Android:
  NONE("none");

  fun toAndroidValue(status: EventStatus?): Int? = when (status) {
    CONFIRMED -> CalendarContract.Events.STATUS_CONFIRMED
    TENTATIVE -> CalendarContract.Events.STATUS_TENTATIVE
    CANCELED -> CalendarContract.Events.STATUS_CANCELED
    else -> CalendarContract.Events.STATUS_CANCELED
  }

  companion object {
    fun fromAndroidValue(value: Int): EventStatus? = when (value) {
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
    fun fromAndroidValue(value: Int): EventAccessLevel? = when (value) {
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

  fun toAndroidValue(): Int? =  when (this) {
    ALERT -> CalendarContract.Reminders.METHOD_ALERT
    ALARM -> CalendarContract.Reminders.METHOD_ALARM
    EMAIL -> CalendarContract.Reminders.METHOD_EMAIL
    SMS -> CalendarContract.Reminders.METHOD_SMS
    else -> CalendarContract.Reminders.METHOD_DEFAULT
  }

  companion object {
    fun fromAndroidValue(value: Int): AlarmMethod? = when (value) {
      CalendarContract.Reminders.METHOD_ALARM -> ALARM
      CalendarContract.Reminders.METHOD_ALERT -> ALERT
      CalendarContract.Reminders.METHOD_EMAIL -> EMAIL
      CalendarContract.Reminders.METHOD_SMS -> SMS
      CalendarContract.Reminders.METHOD_DEFAULT -> DEFAULT
      else -> DEFAULT
    }
  }
}
