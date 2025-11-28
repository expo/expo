package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.phone.operations.AppendablePhone
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.model.phone.operations.NewPhone
import expo.modules.contacts.next.domain.model.phone.operations.PatchPhone
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.PhoneLabelMapper
import expo.modules.contacts.next.records.fields.PhoneRecord

object PhoneMapper {
  fun toNew(record: PhoneRecord.New): NewPhone =
    NewPhone(
      number = record.number,
      label = PhoneLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: PhoneRecord.New, rawContactId: RawContactId): AppendablePhone =
    AppendablePhone(
      rawContactId = rawContactId,
      number = record.number,
      label = PhoneLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: PhoneRecord.Existing): ExistingPhone =
    ExistingPhone(
      dataId = DataId(record.id),
      number = record.number,
      label = PhoneLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: PhoneRecord.Patch): PatchPhone =
    PatchPhone(
      dataId = DataId(record.id),
      number = record.number,
      label = PhoneLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingPhone): PhoneRecord.Existing =
    PhoneRecord.Existing(
      id = model.dataId.value,
      label = PhoneLabelMapper.toRecord(model.label),
      number = model.number
    )
}
