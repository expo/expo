package expo.modules.contacts.next.services

import expo.modules.contacts.next.RawContactIdNotFoundException
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.services.property.PropertyAccessor
import expo.modules.core.utilities.ifNull

class PropertyManager<TExisting : Extractable, TPropertyType>(
  val contactId: ContactId,
  val field: ExtractableField<TExisting>,
  val fieldPropertyAccessor: PropertyAccessor<TExisting, TPropertyType>,
  val repository: ContactRepository
) {
  suspend fun get(): TPropertyType? {
    val model = repository
      .getField(field, contactId)
      .firstOrNull()
      .ifNull { return null }
    return fieldPropertyAccessor.extractFrom(model)
  }

  suspend fun set(newValue: TPropertyType?): Boolean {
    val dataId = repository
      .getField(field, contactId)
      .firstOrNull()
      ?.dataId
    if (dataId != null) {
      val patchable = fieldPropertyAccessor.toFieldPatchable(dataId, newValue)
      return repository.patchFieldEntry(patchable)
    } else {
      val rawContactId = repository.getRawContactId(contactId)
        ?: throw RawContactIdNotFoundException()
      val appendable = fieldPropertyAccessor.toFieldAppendable(newValue, rawContactId)
      repository.appendField(appendable)
      return true
    }
  }
}
