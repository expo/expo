package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.mappers.domain.data.DataPropertyMapper

open class DataProperty<TDomain : Extractable.Data, TDto>(
  protected val field: ExtractableField.Data<TDomain>,
  protected val readMapper: DataPropertyMapper<TDomain, TDto>,
  protected val contactId: ContactId,
  protected val repository: ContactRepository
) {
  suspend fun get(): TDto? {
    val model = repository
      .getFieldFromData(field, contactId)
      .firstOrNull() ?: return null
    return readMapper.toDto(model)
  }
}
