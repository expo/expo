package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.structuredpostal.operations.AppendableStructuredPostal
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.model.structuredpostal.operations.NewStructuredPostal
import expo.modules.contacts.next.domain.model.structuredpostal.operations.PatchStructuredPostal
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.StructuredPostalLabelMapper
import expo.modules.contacts.next.records.fields.PostalAddressRecord

object StructuredPostalMapper {
  fun toNew(record: PostalAddressRecord.New): NewStructuredPostal =
    NewStructuredPostal(
      street = record.street,
      city = record.city,
      region = record.region,
      postcode = record.postcode,
      country = record.country,
      label = StructuredPostalLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: PostalAddressRecord.New, rawContactId: RawContactId): AppendableStructuredPostal =
    AppendableStructuredPostal(
      rawContactId = rawContactId,
      street = record.street,
      city = record.city,
      region = record.region,
      postcode = record.postcode,
      country = record.country,
      label = StructuredPostalLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: PostalAddressRecord.Existing): ExistingStructuredPostal =
    ExistingStructuredPostal(
      dataId = DataId(record.id),
      street = record.street,
      city = record.city,
      region = record.region,
      postcode = record.postcode,
      country = record.country,
      label = StructuredPostalLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: PostalAddressRecord.Patch): PatchStructuredPostal =
    PatchStructuredPostal(
      dataId = DataId(record.id),
      street = record.street,
      city = record.city,
      region = record.region,
      postcode = record.postcode,
      country = record.country,
      label = StructuredPostalLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingStructuredPostal): PostalAddressRecord.Existing =
    PostalAddressRecord.Existing(
      id = model.dataId.value,
      street = model.street,
      city = model.city,
      region = model.region,
      postcode = model.postcode,
      country = model.country,
      label = StructuredPostalLabelMapper.toRecord(model.label)
    )
}
