package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.relationship.operations.AppendableRelation
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.model.relationship.operations.NewRelation
import expo.modules.contacts.next.domain.model.relationship.operations.PatchRelation
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.RelationshipLabelMapper
import expo.modules.contacts.next.records.fields.RelationRecord

object RelationMapper : ListDataPropertyMapper<ExistingRelation, RelationRecord.Existing, RelationRecord.New> {
  fun toNew(record: RelationRecord.New): NewRelation =
    NewRelation(
      name = record.name,
      label = RelationshipLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: RelationRecord.New, rawContactId: RawContactId): AppendableRelation =
    AppendableRelation(
      rawContactId = rawContactId,
      name = newValue.name,
      label = RelationshipLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: RelationRecord.Existing): ExistingRelation =
    ExistingRelation(
      dataId = DataId(newValue.id),
      name = newValue.name,
      label = RelationshipLabelMapper.toDomain(newValue.label)
    )

  fun toPatch(record: RelationRecord.Patch): PatchRelation =
    PatchRelation(
      dataId = DataId(record.id),
      name = record.name,
      label = RelationshipLabelMapper.toDomain(record.label)
    )

  override fun toDto(model: ExistingRelation): RelationRecord.Existing =
    RelationRecord.Existing(
      id = model.dataId.value,
      name = model.name,
      label = RelationshipLabelMapper.toRecord(model.label)
    )
}
