package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.mappers.domain.contacts.ContactsPropertyMapper

open class ContactsProperty<TDomain : Extractable, TDto>(
  protected val field: ExtractableField.Contacts<TDomain>,
  protected val readMapper: ContactsPropertyMapper<TDomain, TDto>,
  protected val contactId: ContactId,
  protected val repository: ContactRepository
) {
  suspend fun get(): TDto? {
    val model = repository.getFieldFromContacts(field, contactId)
      ?: return null
    return readMapper.toDto(model)
  }
}
