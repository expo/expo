package expo.modules.calendar.next.domain.dto.attendee

import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.wrappers.EventId

data class AttendeeInput(
  val eventId: EventId,
  val email: String? = null,
  val name: String? = null,
  val role: AttendeeRole? = null,
  val status: AttendeeStatus? = null,
  val type: AttendeeType? = null
)
