package expo.modules.calendar.next.domain.dto.event

import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

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
}
