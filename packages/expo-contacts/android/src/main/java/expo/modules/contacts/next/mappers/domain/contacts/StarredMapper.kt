package expo.modules.contacts.next.mappers.domain.contacts

import expo.modules.contacts.next.domain.model.headers.starred.ExistingStarred
import expo.modules.contacts.next.domain.model.headers.starred.Starred
import expo.modules.contacts.next.domain.wrappers.ContactId

object StarredMapper: MutableContactsPropertyMapper<Starred, Boolean>{
  override fun toDto(model: Starred) = model.value == 1

  override fun toUpdatable(contactId: ContactId, newValue: Boolean)
    = ExistingStarred(contactId, newValue)
}
