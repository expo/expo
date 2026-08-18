package expo.modules.calendar.next.domain.dto.attendee

import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.kotlin.types.ValueOrUndefined

class AttendeeUpdate(
  val id: AttendeeId,
  val email: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val role: ValueOrUndefined<AttendeeRole?> = ValueOrUndefined.Undefined(),
  val status: ValueOrUndefined<AttendeeStatus?> = ValueOrUndefined.Undefined(),
  val type: ValueOrUndefined<AttendeeType?> = ValueOrUndefined.Undefined()
)
