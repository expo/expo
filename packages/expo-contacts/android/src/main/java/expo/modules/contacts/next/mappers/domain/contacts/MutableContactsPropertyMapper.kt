package expo.modules.contacts.next.mappers.domain.contacts

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId

interface MutableContactsPropertyMapper<TDomain : Extractable, TDto>: ContactsPropertyMapper<TDomain, TDto> {
  fun toUpdatable(contactId: ContactId, newValue: TDto): Updatable.Contacts
}
