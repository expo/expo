package expo.modules.calendar.next.domain.dto.event

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId
import java.util.TimeZone

class EventInput(
  val calendarId: CalendarId? = null,
  val title: String? = null,
  val description: String? = null,
  val dtStart: Long? = null,
  val dtEnd: Long? = null,
  val availability: Availability? = null,
  val allDay: Boolean? = null,
  val eventLocation: String? = null,
  val organizer: String? = null,
  val guestsCanModify: Boolean? = null,
  val guestsCanInviteOthers: Boolean? = null,
  val guestsCanSeeGuests: Boolean? = null,
  val eventTimezone: String? = null,
  val eventEndTimezone: String? = null,
  val accessLevel: AccessLevel? = null,
  val rrule: RecurrenceRule? = null
) {
  fun toExistingEntity(id: EventId) = EventEntity(
    id = id,
    calendarId = calendarId,
    title = title,
    description = description,
    dtStart = dtStart,
    dtEnd = dtEnd,
    availability = availability,
    allDay = allDay,
    eventLocation = eventLocation,
    organizer = organizer,
    guestsCanModify = guestsCanModify,
    guestsCanInviteOthers = guestsCanInviteOthers,
    guestsCanSeeGuests = guestsCanSeeGuests,
    eventTimezone = eventTimezone,
    eventEndTimezone = eventEndTimezone,
    accessLevel = accessLevel,
    rrule = rrule?.let {
      RecurrenceRule(
        frequency = it.frequency,
        interval = it.interval,
        occurrence = it.occurrence,
        endDate = it.endDate
      )
    }
  )

  fun toContentValues() = ContentValues().apply {
    dtStart?.let {
      put(CalendarContract.Events.DTSTART, it)
    }
    dtEnd?.let {
      put(CalendarContract.Events.DTEND, it)
    }
    rrule?.let { recurrence ->
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

    availability?.let {
      put(CalendarContract.Events.AVAILABILITY, it.value)
    }
    title?.let {
      put(CalendarContract.Events.TITLE, it)
    }
    description?.let {
      put(CalendarContract.Events.DESCRIPTION, it)
    }
    eventLocation?.let {
      put(CalendarContract.Events.EVENT_LOCATION, it)
    }
    organizer?.let {
      put(CalendarContract.Events.ORGANIZER, it)
    }
    allDay?.let {
      put(CalendarContract.Events.ALL_DAY, it)
    }
    guestsCanModify?.let {
      put(CalendarContract.Events.GUESTS_CAN_MODIFY, it)
    }
    guestsCanInviteOthers?.let {
      put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, it)
    }
    guestsCanSeeGuests?.let {
      put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, it)
    }
    accessLevel?.let {
      put(CalendarContract.Events.ACCESS_LEVEL, it.value)
    }

    val defaultTimezoneId = TimeZone.getDefault().id
    put(CalendarContract.Events.EVENT_TIMEZONE, eventTimezone ?: defaultTimezoneId)
    put(CalendarContract.Events.EVENT_END_TIMEZONE, eventEndTimezone ?: defaultTimezoneId)
    calendarId?.let {
      put(CalendarContract.Events.CALENDAR_ID, it.value)
    }
  }
}
