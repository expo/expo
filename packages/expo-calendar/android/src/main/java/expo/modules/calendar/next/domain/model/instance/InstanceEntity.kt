package expo.modules.calendar.next.domain.model.instance

import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

data class InstanceEntity(
  val accessLevel: AccessLevel?,
  val allDay: Boolean?,
  val availability: Availability?,
  val begin: Long,
  val calendarId: CalendarId?,
  val description: String?,
  val end: Long,
  val eventEndTimezone: String?,
  val eventId: EventId,
  val eventLocation: String?,
  val eventTimezone: String?,
  val id: Long,
  val guestsCanInviteOthers: Boolean?,
  val guestsCanModify: Boolean?,
  val guestsCanSeeGuests: Boolean?,
  val organizer: String?,
  val originalId: EventId?,
  val rrule: RecurrenceRule?,
  val status: Status? = null,
  val title: String?
)
