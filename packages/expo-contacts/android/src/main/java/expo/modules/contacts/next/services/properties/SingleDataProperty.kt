package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.RawContactIdNotFoundException
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.services.property.PropertyMapper
import expo.modules.core.utilities.ifNull

class SingleDataProperty<TDomain : Extractable.Data, TDto>(
  val contactId: ContactId,
  val field: ExtractableField.Data<TDomain>,
  val mapper: PropertyMapper<TDomain, TDto>,
  val repository: ContactRepository
) {
  suspend fun get(): TDto? {
    val model = repository
      .getFieldFromData(field, contactId)
      .firstOrNull()
      .ifNull {
        return null
      }
    return mapper.toDto(model)
  }

  suspend fun set(newValue: TDto?): Boolean {
    val dataId = repository
      .getFieldFromData(field, contactId)
      .firstOrNull()
      ?.dataId
    if (dataId != null) {
      val patchable = mapper.toUpdatable(dataId, newValue)
      return repository.update(patchable)
    } else {
      val rawContactId = repository.getRawContactId(contactId)
        ?: throw RawContactIdNotFoundException()
      val appendable = mapper.toAppendable(newValue, rawContactId)
      repository.append(appendable)
      return true
    }
  }
}
