package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.dto.extendedproperty.ExtendedPropertyInput
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.records.ExtendedPropertyRecord

class ExtendedPropertyMapper {
  /**
   * Maps [entity] for the JS surface, or returns null for a row the provider handed back without a
   * name or without a value. No constraint forbids either, and a property carrying no name can be
   * neither read back nor deleted by one, so it is left out rather than surfaced as a null.
   */
  fun toRecord(entity: ExtendedPropertyEntity): ExtendedPropertyRecord? {
    val name = entity.name ?: return null
    val value = entity.value ?: return null
    return ExtendedPropertyRecord(name = name, value = value)
  }

  fun toInput(name: String, value: String) = ExtendedPropertyInput(
    name = name,
    value = value
  )
}
