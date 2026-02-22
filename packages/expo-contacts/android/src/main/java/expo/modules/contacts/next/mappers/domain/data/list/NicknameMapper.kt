package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.nickname.operations.AppendableNickname
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.nickname.operations.NewNickname
import expo.modules.contacts.next.domain.model.nickname.operations.PatchNickname
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.NicknameLabelMapper
import expo.modules.contacts.next.records.fields.ExtraNameRecord

object NicknameMapper : ListDataPropertyMapper<ExistingNickname, ExtraNameRecord.Existing, ExtraNameRecord.New> {
  fun toNew(record: ExtraNameRecord.New) =
    NewNickname(
      name = record.name,
      label = NicknameLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: ExtraNameRecord.New, rawContactId: RawContactId) =
    AppendableNickname(
      rawContactId = rawContactId,
      name = newValue.name,
      label = NicknameLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: ExtraNameRecord.Existing) =
    ExistingNickname(
      dataId = DataId(newValue.id),
      name = newValue.name,
      label = NicknameLabelMapper.toDomain(newValue.label)
    )

  fun toPatch(record: ExtraNameRecord.Patch) =
    PatchNickname(
      dataId = DataId(record.id),
      name = record.name,
      label = NicknameLabelMapper.toDomain(record.label)
    )

  override fun toDto(model: ExistingNickname) =
    ExtraNameRecord.Existing(
      id = model.dataId.value,
      label = NicknameLabelMapper.toRecord(model.label),
      name = model.name
    )
}
