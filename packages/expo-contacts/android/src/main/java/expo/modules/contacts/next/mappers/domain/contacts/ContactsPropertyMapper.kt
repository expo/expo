package expo.modules.contacts.next.mappers.domain.contacts

import expo.modules.contacts.next.domain.model.Extractable

fun interface ContactsPropertyMapper<TDomain : Extractable, TDto>{
  fun toDto(model: TDomain): TDto
}
