package expo.modules.calendar.next

import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.Source

data class ExpoCalendarData(
  val id: String?,
  val title: String?,
  val isPrimary: Boolean,
  val allowedAvailabilities: List<String>,
  val name: String?,
  val color: String?,
  val ownerAccount: String?,
  val timeZone: String?,
  val allowedReminders: List<AlarmMethod>,
  val allowedAttendeeTypes: List<AttendeeType>,
  val isVisible: Boolean,
  val isSynced: Boolean,
  val accessLevel: CalendarAccessLevel?,
  val allowsModifications: Boolean,
  val source: Source?
)
