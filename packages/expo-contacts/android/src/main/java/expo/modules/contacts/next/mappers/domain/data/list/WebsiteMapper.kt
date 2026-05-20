package expo.modules.contacts.next.mappers.domain.data.list

import expo.modules.contacts.next.domain.model.website.operations.AppendableWebsite
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.model.website.operations.NewWebsite
import expo.modules.contacts.next.domain.model.website.operations.PatchWebsite
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.domain.data.list.label.WebsiteLabelMapper
import expo.modules.contacts.next.records.fields.UrlAddressRecord

object WebsiteMapper : ListDataPropertyMapper<ExistingWebsite, UrlAddressRecord.Existing, UrlAddressRecord.New> {
  fun toNew(record: UrlAddressRecord.New) =
    NewWebsite(
      url = record.url,
      label = WebsiteLabelMapper.toDomain(record.label)
    )

  override fun toAppendable(newValue: UrlAddressRecord.New, rawContactId: RawContactId) =
    AppendableWebsite(
      rawContactId = rawContactId,
      url = newValue.url,
      label = WebsiteLabelMapper.toDomain(newValue.label)
    )

  override fun toUpdatable(newValue: UrlAddressRecord.Existing) =
    ExistingWebsite(
      dataId = DataId(newValue.id),
      url = newValue.url,
      label = WebsiteLabelMapper.toDomain(newValue.label)
    )

  fun toPatch(record: UrlAddressRecord.Patch) =
    PatchWebsite(
      dataId = DataId(record.id),
      url = record.url,
      label = WebsiteLabelMapper.toDomain(record.label)
    )

  override fun toDto(model: ExistingWebsite) =
    UrlAddressRecord.Existing(
      id = model.dataId.value,
      label = WebsiteLabelMapper.toRecord(model.label),
      url = model.url
    )
}
