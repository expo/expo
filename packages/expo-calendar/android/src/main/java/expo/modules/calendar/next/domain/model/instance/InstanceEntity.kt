package expo.modules.calendar.next.domain.model.instance

import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

/**
 * Calendar instance entity mapped from the Android database cursor.
 *
 * Mapping Assumptions:
 * - [id], [eventId], [begin], and [end] are non-nullable fields required by the provider.
 * - Null booleans ([allDay], guest permission flags) are mapped to `false`.
 * - [accessLevel] null is not equivalent to [AccessLevel.DEFAULT].
 *
 * Design Note:
 * Default values are intentionally omitted to ensure compile-time safety.
 * This forces the mapper to explicitly handle every field and prevents
 * accidental omissions during cursor reading.
 */
data class InstanceEntity(
  val accessLevel: AccessLevel?,
  val allDay: Boolean,
  val availability: Availability?,
  val begin: Long,
  val calendarId: CalendarId?,
  val description: String?,
  val end: Long,
  val eventEndTimezone: String?,
  val eventId: EventId,
  val eventLocation: String?,
  val eventTimezone: String?,
  val id: Long,
  val guestsCanInviteOthers: Boolean,
  val guestsCanModify: Boolean,
  val guestsCanSeeGuests: Boolean,
  val organizer: String?,
  val originalId: EventId?,
  val rrule: RecurrenceRule?,
  val status: Status?,
  val title: String?
)
