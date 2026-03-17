package expo.modules.calendar.next.domain.model.attendee

import expo.modules.calendar.next.domain.wrappers.AttendeeId

data class AttendeeEntity(
  val id: AttendeeId,
  val email: String? = null,
  val name: String? = null,
  val role: AttendeeRole? = null,
  val status: AttendeeStatus? = null,
  val type: AttendeeType? = null
)
