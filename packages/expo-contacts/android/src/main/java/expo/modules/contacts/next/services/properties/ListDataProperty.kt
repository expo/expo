package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.RawContactIdNotFoundException
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.mappers.domain.data.list.ListDataPropertyMapper
import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord

class ListDataProperty<
  TDomain : Extractable.Data,
  TExistingDto : ExistingRecord,
  TNewDto : NewRecord
  >(
  private val extractableField: ExtractableField.Data<TDomain>,
  private val mapper: ListDataPropertyMapper<TDomain, TExistingDto, TNewDto>,
  private val contactId: ContactId,
  private val repository: ContactRepository
) {
  suspend fun getAll(): List<TExistingDto> =
    repository.getFieldFromData(extractableField, contactId)
      .map { mapper.toDto(it) }

  suspend fun add(record: TNewDto): String {
    val rawContactId = repository.getRawContactId(contactId)
      ?: throw RawContactIdNotFoundException()
    return repository.append(mapper.toAppendable(record, rawContactId)).value
  }

  suspend fun update(record: TExistingDto) =
    repository.update(mapper.toUpdatable(record))

  suspend fun delete(record: TExistingDto) =
    repository.deleteFieldEntry(DataId(record.id))
}
