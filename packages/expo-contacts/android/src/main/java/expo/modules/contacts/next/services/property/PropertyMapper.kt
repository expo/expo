package expo.modules.contacts.next.services.property

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId

interface PropertyMapper<TDomain : Extractable, TDto>: ReadPropertyMapper<TDomain, TDto>{
  fun toUpdatable(dataId: DataId, newValue: TDto?): Updatable.Data
  fun toAppendable(newValue: TDto?, rawContactId: RawContactId): Appendable
}

interface ReadPropertyMapper<TDomain : Extractable, TDto> {
  fun toDto(model: TDomain): TDto?
}