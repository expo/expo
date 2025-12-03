package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.RawContactIdNotFoundException
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.mappers.domain.data.MutableDataPropertyMapper

class MutableDataProperty<TDomain : Extractable.Data, TDto>(
  field: ExtractableField.Data<TDomain>,
  private val mapper: MutableDataPropertyMapper<TDomain, TDto>,
  contactId: ContactId,
  repository: ContactRepository
) : DataProperty<TDomain, TDto>(field, mapper, contactId, repository) {
  suspend fun set(newValue: TDto): Boolean {
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