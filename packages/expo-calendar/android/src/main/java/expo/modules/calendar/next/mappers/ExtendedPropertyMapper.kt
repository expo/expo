package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.dto.extendedproperty.ExtendedPropertyInput
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.records.ExtendedPropertyRecord

class ExtendedPropertyMapper {
  fun toRecord(entity: ExtendedPropertyEntity) = ExtendedPropertyRecord(
    name = entity.name,
    value = entity.value
  )

  fun toInput(name: String, value: String) = ExtendedPropertyInput(
    name = name,
    value = value
  )
}
