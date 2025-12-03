package expo.modules.contacts.next.mappers.domain.contacts

import expo.modules.contacts.next.domain.model.headers.DisplayName

object DisplayNameMapper: ContactsPropertyMapper<DisplayName, String?>{
  override fun toDto(model: DisplayName) = model.value
}
