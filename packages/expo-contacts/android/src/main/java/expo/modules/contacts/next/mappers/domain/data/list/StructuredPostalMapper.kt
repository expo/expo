package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.structuredpostal.operations.AppendableStructuredPostal
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.model.structuredpostal.operations.NewStructuredPostal
import expo.modules.contacts.next.domain.model.structuredpostal.operations.PatchStructuredPostal
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.StructuredPostalLabelMapper
import expo.modules.contacts.next.records.fields.AddressRecord

object StructuredPostalMapper: ListDataPropertyMapper<ExistingStructuredPostal, AddressRecord.Existing, AddressRecord.New> {
  fun toNew(record: AddressRecord.New): NewStructuredPostal =
    NewStructuredPostal(
      street = record.street,
      city = record.city,
      region = record.region,
      postcode = record.postcode,
      country = record.country,
      label = StructuredPostalLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: AddressRecord.New, rawContactId: RawContactId): AppendableStructuredPostal =
    AppendableStructuredPostal(
      rawContactId = rawContactId,
      street = newValue.street,
      city = newValue.city,
      region = newValue.region,
      postcode = newValue.postcode,
      country = newValue.country,
      label = StructuredPostalLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: AddressRecord.Existing): ExistingStructuredPostal =
    ExistingStructuredPostal(
      dataId = DataId(newValue.id),
      street = newValue.street,
      city = newValue.city,
      region = newValue.region,
      postcode = newValue.postcode,
      country = newValue.country,
      label = StructuredPostalLabelMapper.toDomain(newValue.label)
    )

  fun toPatch(record: AddressRecord.Patch): PatchStructuredPostal =
    PatchStructuredPostal(
      dataId = DataId(record.id),
      street = record.street,
      city = record.city,
      region = record.region,
      postcode = record.postcode,
      country = record.country,
      label = StructuredPostalLabelMapper.toDomain(record.label)
    )

  override fun toDto(model: ExistingStructuredPostal): AddressRecord.Existing =
    AddressRecord.Existing(
      id = model.dataId.value,
      street = model.street,
      city = model.city,
      region = model.region,
      postcode = model.postcode,
      country = model.country,
      label = StructuredPostalLabelMapper.toRecord(model.label)
    )
}
