package expo.modules.calendar.next.domain.model.event

import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId

/**
 * Event entity mapped from the Android database cursor or constructed from event input.
 *
 * Mapping Assumptions:
 * - [id] is a non-nullable primary key.
 * - [accessLevel] null is not equivalent to [AccessLevel.DEFAULT].
 * - Nullable fields represent genuinely optional event metadata.
 *
 * Design Note:
 * Default values are intentionally omitted to ensure compile-time safety.
 * This forces callers and mappers to explicitly handle every field and prevents
 * accidental omissions during construction.
 */
data class EventEntity(
  val id: EventId,
  val accessLevel: AccessLevel?,
  val allDay: Boolean?,
  val availability: Availability?,
  val calendarId: CalendarId?,
  val description: String?,
  val dtEnd: Long?,
  val dtStart: Long?,
  val eventEndTimezone: String?,
  val eventLocation: String?,
  val eventTimezone: String?,
  val guestsCanInviteOthers: Boolean?,
  val guestsCanModify: Boolean?,
  val guestsCanSeeGuests: Boolean?,
  val organizer: String?,
  val originalId: EventId?,
  val rrule: RecurrenceRule?,
  val status: Status?,
  val title: String?
)
