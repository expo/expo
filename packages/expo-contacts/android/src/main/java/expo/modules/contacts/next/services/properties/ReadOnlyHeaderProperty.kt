package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.core.utilities.ifNull

class ReadOnlyHeaderProperty<TDomain: Extractable, TDto>(
  val contactId: ContactId,
  val repository: ContactRepository,
  val field: ExtractableField.Contacts<TDomain>,
  val mapToDto: (TDomain) -> TDto
)  {
  suspend fun get(): TDto? {
    val model = repository
      .getFieldFromContacts(field, contactId)
      .ifNull {
        return null
      }
    return mapToDto(model)
  }
}