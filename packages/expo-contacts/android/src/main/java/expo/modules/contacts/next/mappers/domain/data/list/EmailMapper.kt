package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.email.operations.AppendableEmail
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.email.operations.NewEmail
import expo.modules.contacts.next.domain.model.email.operations.PatchEmail
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.EmailLabelMapper
import expo.modules.contacts.next.records.fields.EmailRecord

object EmailMapper : ListDataPropertyMapper<ExistingEmail, EmailRecord.Existing, EmailRecord.New> {
  fun toNew(record: EmailRecord.New): NewEmail =
    NewEmail(
      address = record.address,
      label = EmailLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: EmailRecord.Patch): PatchEmail =
    PatchEmail(
      dataId = DataId(record.id),
      address = record.address,
      label = EmailLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: EmailRecord.New, rawContactId: RawContactId): AppendableEmail =
    AppendableEmail(
      rawContactId = rawContactId,
      address = newValue.address,
      label = EmailLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: EmailRecord.Existing): ExistingEmail =
    ExistingEmail(
      dataId = DataId(newValue.id),
      address = newValue.address,
      label = EmailLabelMapper.toDomain(newValue.label)
    )

  override fun toDto(model: ExistingEmail): EmailRecord.Existing =
    EmailRecord.Existing(
      id = model.dataId.value,
      label = EmailLabelMapper.toRecord(model.label),
      address = model.address
    )
}
