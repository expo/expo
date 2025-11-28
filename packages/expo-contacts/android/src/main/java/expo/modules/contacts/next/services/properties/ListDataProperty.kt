package expo.modules.contacts.next.services.properties

import expo.modules.contacts.next.RawContactIdNotFoundException
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord

class ListDataProperty<
  TExistingModel : Extractable.Data,
  TNewRecord : NewRecord,
  TExistingRecord : ExistingRecord
  >(
  private val extractableField: ExtractableField.Data<TExistingModel>,
  private val contactId: ContactId,
  private val repository: ContactRepository,
  private val mapper: ContactRecordDomainMapper
) {
  suspend fun getAll(): List<TExistingRecord> =
    repository.getFieldFromData(extractableField, contactId)
      .map { mapper.toRecord(it) }

  suspend fun add(record: TNewRecord): String {
    val rawContactId = repository.getRawContactId(contactId)
      ?: throw RawContactIdNotFoundException()
    return repository.append(mapper.toAppendable(record, rawContactId)).value
  }

  suspend fun update(record: TExistingRecord) =
    repository.update(mapper.toUpdatable(record))

  suspend fun delete(record: TExistingRecord) =
    repository.deleteFieldEntry(DataId(record.id))
}
