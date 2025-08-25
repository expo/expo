package expo.modules.calendar.next.records

import android.content.ContentResolver
import android.database.Cursor
import android.provider.CalendarContract
import android.util.Log
import expo.modules.calendar.CalendarModule.Companion.TAG
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.CalendarUtils.sdf
import expo.modules.calendar.EventRecurrenceUtils.dateFormat
import expo.modules.calendar.EventRecurrenceUtils.rrFormat
import expo.modules.calendar.accessConstantMatchingString
import expo.modules.calendar.availabilityConstantMatchingString
import expo.modules.calendar.next.CalendarNextUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import java.text.ParseException
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
) : Record {

  companion object {
    /**
     * Creates an EventRecord from a Cursor.
     *
     * @param cursor The Cursor to create the EventRecord from. The cursor should be the result of `findEventsQueryParameters` query.
     * @return The EventRecord created from the Cursor.
     */
    @JvmStatic
    fun fromCursor(cursor: Cursor, contentResolver: ContentResolver): EventRecord {
      // may be CalendarContract.Instances.BEGIN or CalendarContract.Events.DTSTART (which have different string values)
      val startDate = cursor.getString(3)
      val endDate = cursor.getString(4)

      val eventId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Instances.EVENT_ID)
        ?: CalendarUtils.optStringFromCursor(cursor, CalendarContract.Instances._ID)

      // unfortunately the string values of CalendarContract.Events._ID and CalendarContract.Instances._ID are equal
      // so we'll use the somewhat brittle column number from the query
      val instanceId = if (cursor.columnCount > 18) CalendarUtils.optStringFromCursor(cursor, CalendarContract.Instances._ID) else "";

      return EventRecord(
        id = eventId,
        calendarId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.CALENDAR_ID),
        title = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.TITLE),
        notes = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.DESCRIPTION),
        alarms = if (eventId != null) serializeAlarms(contentResolver, eventId)?.toList() else null,
        recurrenceRule = extractRecurrenceRuleFromString(CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.RRULE)),
        startDate = CalendarNextUtils.dateToString(startDate?.toLongOrNull()),
        endDate = CalendarNextUtils.dateToString(endDate?.toLongOrNull()),
        allDay = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.ALL_DAY) != 0,
        location = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_LOCATION),
        availability = EventAvailability.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.AVAILABILITY)),
        timeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_TIMEZONE),
        endTimeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_END_TIMEZONE),
        status = EventStatus.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.STATUS)),
        organizerEmail = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.ORGANIZER),
        accessLevel = EventAccessLevel.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.ACCESS_LEVEL)),
        guestsCanModify = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_MODIFY) != 0,
        guestsCanInviteOthers = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0,
        guestsCanSeeGuests = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0,
        originalId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.ORIGINAL_ID),
        instanceId = instanceId
      )
    }

    private fun serializeAlarms(contentResolver: ContentResolver, eventId: String): ArrayList<AlarmRecord>? {
      val alarms = ArrayList<AlarmRecord>()
      val cursor = CalendarContract.Reminders.query(
        contentResolver,
        eventId.toLong(),
        arrayOf(
          CalendarContract.Reminders.MINUTES,
          CalendarContract.Reminders.METHOD
        )
      )
      while (cursor.moveToNext()) {
        val method = cursor.getInt(1)
        val thisAlarm = AlarmRecord(
          relativeOffset = -cursor.getInt(0),
          method = AlarmMethod.fromAndroidValue(method)
        )
        alarms.add(thisAlarm)
      }
      return alarms
    }

    private fun extractRecurrenceRuleFromString(rrule: String?): RecurrenceRuleRecord? {
      if (rrule == null) {
        return null
      }
      val ruleMap = mutableMapOf<String, String>()
      rrule.split(";").forEach { part ->
        val keyValue = part.split("=")
        if (keyValue.size == 2) {
          ruleMap[keyValue[0].uppercase(Locale.getDefault())] = keyValue[1]
        }
      }

      val frequency = ruleMap["FREQ"]?.lowercase(Locale.getDefault())
      val interval = ruleMap["INTERVAL"]?.toIntOrNull()
      var endDate: String? = null
      var occurrence: Int? = null

      ruleMap["UNTIL"]?.let { untilValue ->
        try {
          // Try to parse the UNTIL value using the known date format, fallback to raw string if parsing fails
          endDate = try {
            val date = rrFormat.parse(untilValue);
            if (date == null) {
              return null;
            }
            dateFormat.format(date)
          } catch (e: ParseException) {
            Log.e(TAG, "Couldn't parse the `endDate` property.", e)
            untilValue
          }
        } catch (e: Exception) {
          Log.e(TAG, "endDate is null or invalid", e)
          endDate = untilValue
        }
      }

      ruleMap["COUNT"]?.let { countValue ->
        occurrence = countValue.toIntOrNull()
      }
      return RecurrenceRuleRecord(
        endDate = endDate,
        frequency = frequency,
        interval = interval,
        occurrence = occurrence,
      )
    }
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
  @Field
  var futureEvents: Boolean?
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

  fun toAndroidValue(): Int? = when (this) {
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
