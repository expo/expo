package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.records.AttendeeRole
import expo.modules.calendar.next.records.AttendeeStatus
import expo.modules.calendar.next.records.AttendeeType

class ExpoCalendarAttendeeData(
  val id: String,
  val email: String?,
  val name: String?,
  val role: AttendeeRole?,
  val status: AttendeeStatus?,
  val type: AttendeeType?
)
