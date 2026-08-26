package expo.modules.calendar.next.domain.model.extendedproperty

import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId

/**
 * Extended property entity mapped from the Android database cursor.
 *
 * Mapping Assumptions:
 * - [id], [eventId], [name] and [value] are non-nullable columns of `CalendarContract.ExtendedProperties`.
 * - [name] is stored verbatim, prefix included, because properties written by other apps
 *   (or by the platform itself) use conventions this module does not control.
 *
 * Design Note:
 * Default values are intentionally omitted to ensure compile-time safety.
 * This forces the mapper to explicitly handle every field and prevents
 * accidental omissions during cursor reading.
 */
data class ExtendedPropertyEntity(
  val id: ExtendedPropertyId,
  val eventId: EventId,
  val name: String,
  val value: String
)
