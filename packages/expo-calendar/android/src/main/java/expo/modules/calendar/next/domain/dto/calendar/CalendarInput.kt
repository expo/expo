package expo.modules.calendar.next.domain.dto.calendar

import expo.modules.calendar.next.domain.model.calendar.AllowedAttendeeType
import expo.modules.calendar.next.domain.model.calendar.AllowedAvailability
import expo.modules.calendar.next.domain.model.calendar.AllowedReminder
import expo.modules.calendar.next.domain.model.calendar.CalendarAccessLevel
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.wrappers.CalendarId

data class CalendarInput(
  val accountName: String? = null,
  val accountType: String? = null,
  val allowedAttendeeTypes: List<AllowedAttendeeType> = emptyList(),
  val allowedAvailability: List<AllowedAvailability> = emptyList(),
  val allowedReminders: List<AllowedReminder> = emptyList(),
  val calendarAccessLevel: CalendarAccessLevel? = null,
  val calendarColor: Int? = null,
  val calendarDisplayName: String,
  val calendarTimeZone: String? = null,
  val isPrimary: Boolean = true,
  val name: String? = null,
  val ownerAccount: String? = null,
  val syncEvents: Boolean = true,
  val visible: Boolean = true
) {
  fun toCalendarEntity(id: CalendarId) = CalendarEntity(
    id = id,
    accountName = accountName,
    accountType = accountType,
    allowedAttendeeTypes = allowedAttendeeTypes,
    allowedAvailability = allowedAvailability,
    allowedReminders = allowedReminders,
    calendarAccessLevel = calendarAccessLevel,
    calendarColor = calendarColor,
    calendarDisplayName = calendarDisplayName,
    calendarTimeZone = calendarTimeZone,
    isPrimary = isPrimary,
    name = name,
    ownerAccount = ownerAccount,
    syncEvents = syncEvents,
    visible = visible
  )
}
