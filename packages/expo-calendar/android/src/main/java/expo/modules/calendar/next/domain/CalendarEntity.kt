package expo.modules.calendar.next.domain

data class CalendarEntity(
  val id: String?,
  val title: String?,
  val isPrimary: Boolean?,
  val allowedAvailabilities: List<Availability>?,
  val name: String?,
  val color: Int?,
  val ownerAccount: String?,
  val timeZone: String?,
  val allowedReminders: List<AlarmMethod>?,
  val allowedAttendeeTypes: List<AttendeeType>?,
  val isVisible: Boolean?,
  val isSynced: Boolean?,
  val accessLevel: CalendarAccessLevel?,
  val allowsModifications: Boolean?,
  val source: CalendarSource?
)
