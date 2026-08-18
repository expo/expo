package expo.modules.calendar.next.domain.model.attendee

import expo.modules.calendar.next.domain.wrappers.AttendeeId

/**
 * Attendee entity mapped from the Android database cursor.
 *
 * Mapping Assumptions:
 * - [id] is a non-nullable primary key.
 * - Nullable fields represent optional attendee metadata or unknown provider values.
 *
 * Design Note:
 * Default values are intentionally omitted to ensure compile-time safety.
 * This forces the mapper to explicitly handle every field and prevents
 * accidental omissions during cursor reading.
 */
data class AttendeeEntity(
  val id: AttendeeId,
  val email: String?,
  val name: String?,
  val role: AttendeeRole?,
  val status: AttendeeStatus?,
  val type: AttendeeType?
)
