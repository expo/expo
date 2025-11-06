package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.relationship.operations.AppendableRelation
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.model.relationship.operations.NewRelation
import expo.modules.contacts.next.domain.model.relationship.operations.PatchRelation
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.RelationshipLabelMapper
import expo.modules.contacts.next.records.fields.RelationshipRecord

object RelationMapper {
  fun toNew(record: RelationshipRecord.New): NewRelation =
    NewRelation(
      name = record.name,
      label = RelationshipLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: RelationshipRecord.New, rawContactId: RawContactId): AppendableRelation =
    AppendableRelation(
      rawContactId = rawContactId,
      name = record.name,
      label = RelationshipLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: RelationshipRecord.Existing): ExistingRelation =
    ExistingRelation(
      dataId = DataId(record.id),
      name = record.name,
      label = RelationshipLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: RelationshipRecord.Patch): PatchRelation =
    PatchRelation(
      dataId = DataId(record.id),
      name = record.name,
      label = RelationshipLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingRelation): RelationshipRecord.Existing =
    RelationshipRecord.Existing(
      id = model.dataId.value,
      name = model.name,
      label = RelationshipLabelMapper.toRecord(model.label)
    )
}
