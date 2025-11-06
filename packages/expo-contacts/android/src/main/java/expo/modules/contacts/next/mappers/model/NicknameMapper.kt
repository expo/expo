package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.nickname.operations.AppendableNickname
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.nickname.operations.NewNickname
import expo.modules.contacts.next.domain.model.nickname.operations.PatchNickname
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.NicknameLabelMapper
import expo.modules.contacts.next.records.fields.ExtraNameRecord

object NicknameMapper {
  fun toNew(record: ExtraNameRecord.New): NewNickname =
    NewNickname(
      name = record.name,
      label = NicknameLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: ExtraNameRecord.New, rawContactId: RawContactId): AppendableNickname =
    AppendableNickname(
      rawContactId = rawContactId,
      name = record.name,
      label = NicknameLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: ExtraNameRecord.Existing): ExistingNickname =
    ExistingNickname(
      dataId = DataId(record.id),
      name = record.name,
      label = NicknameLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: ExtraNameRecord.Patch): PatchNickname =
    PatchNickname(
      dataId = DataId(record.id),
      name = record.name,
      label = NicknameLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingNickname): ExtraNameRecord.Existing =
    ExtraNameRecord.Existing(
      id = model.dataId.value,
      label = NicknameLabelMapper.toRecord(model.label),
      name = model.name
    )
}
