package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.mappers.domain.contacts.MutableContactsPropertyMapper

class MutableContactsProperty<TDomain : Extractable, TDto>(
  field: ExtractableField.Contacts<TDomain>,
  private val mapper: MutableContactsPropertyMapper<TDomain, TDto>,
  contactId: ContactId,
  repository: ContactRepository,
) : ContactsProperty<TDomain, TDto>(field, mapper, contactId, repository) {
  suspend fun set(value: TDto): Boolean {
    val updatable = mapper.toUpdatable(contactId, value)
    return repository.update(updatable)
  }
}
