package expo.modules.contacts.next.mappers.model

import expo.modules.contacts.next.domain.model.website.operations.AppendableWebsite
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.model.website.operations.NewWebsite
import expo.modules.contacts.next.domain.model.website.operations.PatchWebsite
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.label.WebsiteLabelMapper
import expo.modules.contacts.next.records.fields.UrlAddressRecord

object WebsiteMapper {
  fun toNew(record: UrlAddressRecord.New): NewWebsite =
    NewWebsite(
      url = record.url,
      label = WebsiteLabelMapper.toDomain(record.label)
    )

  fun toAppendable(record: UrlAddressRecord.New, rawContactId: RawContactId): AppendableWebsite =
    AppendableWebsite(
      rawContactId = rawContactId,
      url = record.url,
      label = WebsiteLabelMapper.toDomain(record.label)
    )

  fun toExisting(record: UrlAddressRecord.Existing): ExistingWebsite =
    ExistingWebsite(
      dataId = DataId(record.id),
      url = record.url,
      label = WebsiteLabelMapper.toDomain(record.label)
    )

  fun toPatch(record: UrlAddressRecord.Patch): PatchWebsite =
    PatchWebsite(
      dataId = DataId(record.id),
      url = record.url,
      label = WebsiteLabelMapper.toDomain(record.label)
    )

  fun toRecord(model: ExistingWebsite): UrlAddressRecord.Existing =
    UrlAddressRecord.Existing(
      id = model.dataId.value,
      label = WebsiteLabelMapper.toRecord(model.label),
      url = model.url
    )
}
