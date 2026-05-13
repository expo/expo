package expo.modules.calendar.next.domain.model.calendar

import expo.modules.calendar.next.domain.wrappers.CalendarId

/**
 * Calendar entity mapped from the Android database cursor.
 *
 * Mapping Assumptions:
 * - [id] is a non-nullable primary key.
 * - Null collections ([allowedReminders], etc.) are mapped to [emptyList].
 * - Null booleans ([isPrimary], etc.) are mapped to `false`.
 * - [calendarAccessLevel] null is not equivalent to [CalendarAccessLevel.NONE].
 *
 * Design Note:
 * Default values are intentionally omitted to ensure compile-time safety.
 * This forces the mapper to explicitly handle every field and prevents
 * accidental omissions during cursor reading.
 */
data class CalendarEntity(
  val id: CalendarId,
  val accountName: String?,
  val accountType: String?,
  val allowedAttendeeTypes: List<AllowedAttendeeType>,
  val allowedAvailability: List<AllowedAvailability>,
  val allowedReminders: List<AllowedReminder>,
  val calendarAccessLevel: CalendarAccessLevel?,
  val calendarColor: Int?,
  val calendarDisplayName: String?,
  val calendarTimeZone: String?,
  val isPrimary: Boolean,
  val name: String?,
  val ownerAccount: String?,
  val syncEvents: Boolean,
  val visible: Boolean
)
