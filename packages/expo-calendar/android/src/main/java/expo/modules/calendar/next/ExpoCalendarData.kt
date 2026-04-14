package expo.modules.calendar.next

import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.Source

// ExpoCalendarData represents the properties of a calendar in a format returned to JavaScript.
data class ExpoCalendarData(
  val accessLevel: CalendarAccessLevel?,
  val allowedAttendeeTypes: List<AttendeeType>,
  val allowedAvailabilities: List<String>,
  val allowedReminders: List<AlarmMethod>,
  val allowsModifications: Boolean,
  // Represented as a hex string ("#RRGGBB"), on the native side it's stored as an integer.
  val color: String?,
  val id: String,
  val isPrimary: Boolean,
  val isSynced: Boolean,
  val isVisible: Boolean,
  val name: String?,
  val ownerAccount: String?,
  val source: Source?,
  val timeZone: String?,
  val title: String?
)
