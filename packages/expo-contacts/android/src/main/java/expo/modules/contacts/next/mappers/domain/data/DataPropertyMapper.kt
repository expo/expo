package expo.modules.contacts.next.mappers.domain.data

import expo.modules.contacts.next.domain.model.Extractable

fun interface DataPropertyMapper<TDomain : Extractable.Data, TDto> {
  fun toDto(model: TDomain): TDto
}
