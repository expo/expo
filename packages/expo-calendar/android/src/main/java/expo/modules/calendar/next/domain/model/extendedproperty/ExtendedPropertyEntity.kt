package expo.modules.calendar.next.domain.model.extendedproperty

import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId

/**
 * Extended property entity mapped from the Android database cursor.
 *
 * Mapping Assumptions:
 * - [id] and [eventId] identify the row and the event it hangs from.
 * - [name] and [value] are nullable because no database constraint says otherwise. The entity
 *   holds what the provider handed back, malformed rows included, and the layers above decide
 *   what to do with them.
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
  val name: String?,
  val value: String?
)
