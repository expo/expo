package expo.modules.calendar.next.domain.dto.calendar

import expo.modules.kotlin.types.ValueOrUndefined

/**
 * Fields intentionally excluded from update:
 * - accountName, accountType, ownerAccount — immutable after calendar creation.
 * - calendarAccessLevel — managed by the sync adapter, not the user.
 * - allowedReminders, allowedAvailability, allowedAttendeeTypes — set by the sync adapter.
 */
data class CalendarUpdate(
  val name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val calendarDisplayName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val calendarColor: ValueOrUndefined<Int?> = ValueOrUndefined.Undefined(),
  val visible: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  val syncEvents: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  val calendarTimeZone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
)
