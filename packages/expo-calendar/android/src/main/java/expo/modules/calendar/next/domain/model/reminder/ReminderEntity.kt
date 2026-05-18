package expo.modules.calendar.next.domain.model.reminder

import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ReminderId

/**
 * Reminder entity mapped from the Android database cursor.
 *
 * Mapping Assumptions:
 * - [id], [eventId], and [minutes] are non-nullable fields required by the provider.
 * - [method] remains nullable because the provider may omit it or return an unknown value.
 *
 * Design Note:
 * Default values are intentionally omitted to ensure compile-time safety.
 * This forces the mapper to explicitly handle every field and prevents
 * accidental omissions during cursor reading.
 */
data class ReminderEntity(
  val id: ReminderId,
  val eventId: EventId,
  val method: Method?,
  val minutes: Int
)
