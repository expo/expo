package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.email.operations.AppendableEmail
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.email.operations.NewEmail
import expo.modules.contacts.next.domain.model.email.operations.PatchEmail
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.EmailLabelMapper
import expo.modules.contacts.next.records.fields.EmailRecord

object EmailMapper {
  fun toNew(record: EmailRecord.New): NewEmail =
    NewEmail(
      address = record.address,
      label = EmailLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: EmailRecord.New, rawContactId: RawContactId): AppendableEmail =
    AppendableEmail(
      rawContactId = rawContactId,
      address = record.address,
      label = EmailLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: EmailRecord.Existing): ExistingEmail =
    ExistingEmail(
      dataId = DataId(record.id),
      address = record.address,
      label = EmailLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: EmailRecord.Patch): PatchEmail =
    PatchEmail(
      dataId = DataId(record.id),
      address = record.address,
      label = EmailLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingEmail): EmailRecord.Existing =
    EmailRecord.Existing(
      id = model.dataId.value,
      label = EmailLabelMapper.toRecord(model.label),
      address = model.address
    )
}
