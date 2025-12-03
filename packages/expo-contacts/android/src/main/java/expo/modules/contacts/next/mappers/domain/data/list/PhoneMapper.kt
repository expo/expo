package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.phone.operations.AppendablePhone
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.model.phone.operations.NewPhone
import expo.modules.contacts.next.domain.model.phone.operations.PatchPhone
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.PhoneLabelMapper
import expo.modules.contacts.next.records.fields.PhoneRecord

object PhoneMapper: ListDataPropertyMapper<ExistingPhone, PhoneRecord.Existing, PhoneRecord.New>{
  fun toNew(record: PhoneRecord.New): NewPhone =
    NewPhone(
      number = record.number,
      label = PhoneLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: PhoneRecord.New, rawContactId: RawContactId): AppendablePhone =
    AppendablePhone(
      rawContactId = rawContactId,
      number = newValue.number,
      label = PhoneLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: PhoneRecord.Existing): ExistingPhone =
    ExistingPhone(
      dataId = DataId(newValue.id),
      number = newValue.number,
      label = PhoneLabelMapper.toDomain(newValue.label)
    )

  fun toPatch(record: PhoneRecord.Patch): PatchPhone =
    PatchPhone(
      dataId = DataId(record.id),
      number = record.number,
      label = PhoneLabelMapper.toDomain(record.label)
    )

  override fun toDto(model: ExistingPhone): PhoneRecord.Existing =
    PhoneRecord.Existing(
      id = model.dataId.value,
      label = PhoneLabelMapper.toRecord(model.label),
      number = model.number
    )
}
