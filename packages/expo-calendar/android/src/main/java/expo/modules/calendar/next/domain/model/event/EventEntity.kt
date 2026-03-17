package expo.modules.calendar.next.domain.model.event

import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

data class EventEntity(
  val id: EventId,
  val accessLevel: AccessLevel? = null,
  val allDay: Boolean? = null,
  val availability: Availability? = null,
  val calendarId: CalendarId? = null,
  val description: String? = null,
  val dtEnd: Long? = null,
  val dtStart: Long? = null,
  val eventEndTimezone: String? = null,
  val eventLocation: String? = null,
  val eventTimezone: String? = null,
  val guestsCanInviteOthers: Boolean? = null,
  val guestsCanModify: Boolean? = null,
  val guestsCanSeeGuests: Boolean? = null,
  val organizer: String? = null,
  val originalId: EventId? = null,
  val rrule: RecurrenceRule? = null,
  val status: Status? = null,
  val title: String? = null
)
