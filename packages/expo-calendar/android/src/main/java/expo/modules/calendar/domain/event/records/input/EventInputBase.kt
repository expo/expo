package expo.modules.calendar.domain.event.records.input

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.calendar.domain.event.enums.EventAccessLevel
import expo.modules.calendar.domain.event.records.Alarm
import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.extensions.getTimeInMillis
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.records.Field
import java.util.TimeZone

@OptIn(EitherType::class)
abstract class EventInputBase {
  @Field val alarms: List<Alarm>? = null

  @Field val availability: Availability? = null

  @Field val title: String? = null

  @Field val notes: String? = null

  @Field val location: String? = null

  @Field val organizerEmail: String? = null

  @Field val allDay: Boolean? = null

  @Field val guestsCanModify: Boolean? = null

  @Field val guestsCanInviteOthers: Boolean? = null

  @Field val guestsCanSeeGuests: Boolean? = null

  @Field val timeZone: String? = null

  @Field val endTimeZone: String? = null

  @Field val accessLevel: EventAccessLevel? = null

  @Field val recurrenceRule: RecurrenceRuleInput? = null

  @Field val startDate: DateTimeInput? = null

  @Field val endDate: DateTimeInput? = null

  fun toContentValues() = ContentValues().apply {
    startDate?.let { put(CalendarContract.Events.DTSTART, it.getTimeInMillis()) }
    endDate?.let { put(CalendarContract.Events.DTEND, it.getTimeInMillis()) }

    recurrenceRule?.let { recurrence ->
      if (recurrence.frequency.isEmpty()) {
        return@let
      }

      if (recurrence.endDate == null && recurrence.occurrence == null) {
        val eventStartDate = getAsLong(CalendarContract.Events.DTSTART)
        val eventEndDate = getAsLong(CalendarContract.Events.DTEND)
        val duration = (eventEndDate - eventStartDate) / 1000

        putNull(CalendarContract.Events.LAST_DATE)
        putNull(CalendarContract.Events.DTEND)
        put(CalendarContract.Events.DURATION, "PT${duration}S")
      }

      put(CalendarContract.Events.RRULE, recurrence.toRuleString())
    }

    alarms?.let { put(CalendarContract.Events.HAS_ALARM, true) }
    availability?.let { put(CalendarContract.Events.AVAILABILITY, it.contentProviderValue) }
    title?.let { put(CalendarContract.Events.TITLE, it) }
    notes?.let { put(CalendarContract.Events.DESCRIPTION, it) }
    location?.let { put(CalendarContract.Events.EVENT_LOCATION, it) }
    organizerEmail?.let { put(CalendarContract.Events.ORGANIZER, it) }
    allDay?.let { put(CalendarContract.Events.ALL_DAY, it) }
    guestsCanModify?.let { put(CalendarContract.Events.GUESTS_CAN_MODIFY, it) }
    guestsCanInviteOthers?.let { put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, it) }
    guestsCanSeeGuests?.let { put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, it) }
    accessLevel?.let { put(CalendarContract.Events.ACCESS_LEVEL, it.contentProviderValue) }

    val defaultTimezoneId = TimeZone.getDefault().id
    put(CalendarContract.Events.EVENT_TIMEZONE, timeZone ?: defaultTimezoneId)
    put(CalendarContract.Events.EVENT_END_TIMEZONE, endTimeZone ?: defaultTimezoneId)
  }
}
