package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.core.utilities.ifNull

class MutableHeaderProperty<TDomain : Extractable, TDto>(
  val contactId: ContactId,
  val repository: ContactRepository,
  val field: ExtractableField.Contacts<TDomain>,
  val mapToDto: (TDomain) -> TDto,
  val mapToUpdatable: (TDto) -> Updatable
) {
  suspend fun get(): TDto? {
    val value = repository
      .getFieldFromContacts(field, contactId)
      .ifNull {
        return null
      }
    return mapToDto(value)
  }

  suspend fun set(value: TDto): Boolean {
    val updatable = mapToUpdatable(value)
    return repository.update(updatable)
  }
}