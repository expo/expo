package expo.modules.contacts.next.mappers

import expo.modules.contacts.next.domain.model.*
import expo.modules.contacts.next.domain.model.contact.*
import expo.modules.contacts.next.domain.model.email.EmailField
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.event.EventField
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.headers.DisplayNameField
import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUriField
import expo.modules.contacts.next.domain.model.headers.PhotoUriField
import expo.modules.contacts.next.domain.model.headers.isfavourite.StarredField
import expo.modules.contacts.next.domain.model.nickname.NicknameField
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.note.NoteField
import expo.modules.contacts.next.domain.model.organization.OrganizationField
import expo.modules.contacts.next.domain.model.phone.PhoneField
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.model.relationship.RelationField
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameField
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalField
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.model.website.WebsiteField
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.wrappers.*
import expo.modules.contacts.next.mappers.ContactMapper.toNewNote
import expo.modules.contacts.next.mappers.ContactMapper.toNewOrganization
import expo.modules.contacts.next.mappers.ContactMapper.toNewPhoto
import expo.modules.contacts.next.mappers.ContactMapper.toNewStructuredName
import expo.modules.contacts.next.mappers.model.EmailMapper
import expo.modules.contacts.next.mappers.model.EventMapper
import expo.modules.contacts.next.mappers.model.NicknameMapper
import expo.modules.contacts.next.mappers.model.PhoneMapper
import expo.modules.contacts.next.mappers.model.RelationMapper
import expo.modules.contacts.next.mappers.model.StructuredPostalMapper
import expo.modules.contacts.next.mappers.model.WebsiteMapper
import expo.modules.contacts.next.records.*
import expo.modules.contacts.next.records.contact.*
import expo.modules.contacts.next.records.fields.*
import expo.modules.contacts.next.services.ImageByteArrayConverter
import expo.modules.kotlin.apifeatures.EitherType

class ContactRecordDomainMapper(val imageByteArrayConverter: ImageByteArrayConverter){
  fun toRecord(existingContact: ExistingContact): GetContactDetailsRecord =
    ContactMapper.toRecord(existingContact)

  fun toAppendable(record: NewRecord, rawContactId: RawContactId): Appendable {
    return when (record) {
      is EmailRecord.New -> EmailMapper.toAppendable(record, rawContactId)
      is PhoneRecord.New -> PhoneMapper.toAppendable(record, rawContactId)
      is DateRecord.New -> EventMapper.toAppendable(record, rawContactId)
      is ExtraNameRecord.New -> NicknameMapper.toAppendable(record, rawContactId)
      is PostalAddressRecord.New -> StructuredPostalMapper.toAppendable(record, rawContactId)
      is RelationRecord.New -> RelationMapper.toAppendable(record, rawContactId)
      is UrlAddressRecord.New -> WebsiteMapper.toAppendable(record, rawContactId)
      else -> throw IllegalArgumentException("Unsupported 'NewRecord' type: ${record::class.simpleName}")
    }
  }

  fun toUpdatable(record: ExistingRecord): Updatable {
    return when (record) {
      is EmailRecord.Existing -> EmailMapper.toExisting(record)
      is PhoneRecord.Existing -> PhoneMapper.toExisting(record)
      is DateRecord.Existing -> EventMapper.toExisting(record)
      is ExtraNameRecord.Existing -> NicknameMapper.toExisting(record)
      is PostalAddressRecord.Existing -> StructuredPostalMapper.toExisting(record)
      is RelationRecord.Existing -> RelationMapper.toExisting(record)
      is UrlAddressRecord.Existing -> WebsiteMapper.toExisting(record)
      else -> throw IllegalArgumentException("Unsupported 'ExistingRecord' type: ${record::class.simpleName}")
    }
  }

  fun toPatchable(record: PatchRecord): Updatable {
    return when (record) {
      is EmailRecord.Patch -> EmailMapper.toPatch(record)
      is PhoneRecord.Patch -> PhoneMapper.toPatch(record)
      is DateRecord.Patch -> EventMapper.toPatch(record)
      is ExtraNameRecord.Patch -> NicknameMapper.toPatch(record)
      is PostalAddressRecord.Patch -> StructuredPostalMapper.toPatch(record)
      is RelationRecord.Patch -> RelationMapper.toPatch(record)
      is UrlAddressRecord.Patch -> WebsiteMapper.toPatch(record)
      else -> throw IllegalArgumentException("Unsupported 'PatchRecord' type: ${record::class.simpleName}")
    }
  }

  fun toExtractableField(contactField: ContactField): ExtractableField<*> {
    return when (contactField) {
      ContactField.GIVEN_NAME,
      ContactField.MIDDLE_NAME,
      ContactField.FAMILY_NAME,
      ContactField.PREFIX,
      ContactField.SUFFIX,
      ContactField.PHONETIC_GIVEN_NAME,
      ContactField.PHONETIC_MIDDLE_NAME,
      ContactField.PHONETIC_FAMILY_NAME
        -> StructuredNameField
      ContactField.COMPANY,
      ContactField.DEPARTMENT,
      ContactField.JOB_TITLE,
      ContactField.PHONETIC_COMPANY_NAME
        -> OrganizationField
      ContactField.EMAILS -> EmailField
      ContactField.PHONES -> PhoneField
      ContactField.ADDRESSES -> StructuredPostalField
      ContactField.DATES -> EventField
      ContactField.RELATIONS -> RelationField
      ContactField.URL_ADDRESSES -> WebsiteField
      ContactField.EXTRA_NAMES -> NicknameField
      ContactField.IS_FAVOURITE -> StarredField
      ContactField.NOTE -> NoteField
      ContactField.IMAGE -> PhotoUriField
      ContactField.THUMBNAIL -> PhotoThumbnailUriField
      ContactField.FULL_NAME -> DisplayNameField
    }
  }

  @Suppress("UNCHECKED_CAST")
  fun <TRecord : ExistingRecord, TModel : Extractable> toRecord(model: TModel): TRecord {
    return when (model) {
      is ExistingEmail -> EmailMapper.toRecord(model)
      is ExistingPhone -> PhoneMapper.toRecord(model)
      is ExistingEvent -> EventMapper.toRecord(model)
      is ExistingNickname -> NicknameMapper.toRecord(model)
      is ExistingStructuredPostal -> StructuredPostalMapper.toRecord(model)
      is ExistingRelation -> RelationMapper.toRecord(model)
      is ExistingWebsite -> WebsiteMapper.toRecord(model)
      else -> throw IllegalArgumentException("Unsupported model type for mapping to record")
    } as TRecord
  }

  fun toDomain(record: CreateContactRecord): NewContact {
    val modelsToInsert = buildList {
      add(toNewStructuredName(record))
      add(toNewOrganization(record))
      add(toNewNote(record))
      add(toNewPhoto(record, imageByteArrayConverter))
      record.emails?.let { addAll(it.map(EmailMapper::toNew)) }
      record.phones?.let { addAll(it.map(PhoneMapper::toNew)) }
      record.dates?.let { addAll(it.map(EventMapper::toNew)) }
      record.extraNames?.let { addAll(it.map(NicknameMapper::toNew)) }
      record.addresses?.let { addAll(it.map(StructuredPostalMapper::toNew)) }
      record.relations?.let { addAll(it.map(RelationMapper::toNew)) }
      record.urlAddresses?.let { addAll(it.map(WebsiteMapper::toNew)) }
    }
    return NewContact(record.isFavourite, modelsToInsert)
  }

  @OptIn(EitherType::class)
  fun toPatchContact(
    record: PatchContactRecord,
    rawContactId: RawContactId,
    contactId: ContactId,
    structuredNameDataId: DataId?,
    organizationDataId: DataId?,
    noteDataId: DataId?
  ) = with(ContactPatchBuilder(contactId, rawContactId, this)) {
    if (record.isChangingStructuredName()) {
      if (structuredNameDataId != null) {
        withUpdatable(ContactMapper.toPatchStructuredName(record, structuredNameDataId))
      } else {
        withAppendable(ContactMapper.toAppendableStructuredName(record, rawContactId))
      }
    }
    if (record.isChangingOrganization()) {
      if (organizationDataId != null) {
        withUpdatable(ContactMapper.toPatchOrganization(record, organizationDataId))
      } else {
        withAppendable(ContactMapper.toAppendableOrganization(record, rawContactId))
      }
    }

    if (!record.note.isUndefined) {
      if (noteDataId != null) {
        withUpdatable(ContactMapper.toPatchNote(record, noteDataId))
      } else {
        withAppendable(ContactMapper.toAppendableNote(record, rawContactId))
      }
    }
    withListProperty(record.emails, EmailField)
    withListProperty(record.phones, PhoneField)
    withListProperty(record.dates, EventField)
    withListProperty(record.extraNames, NicknameField)
    withListProperty(record.postalAddresses, StructuredPostalField)
    withListProperty(record.relationships, RelationField)
    withListProperty(record.urlAddresses, WebsiteField)
    build()
  }

  fun toContentValues(createContactRecord: CreateContactRecord) = buildList {
    val structuredName = toNewStructuredName(createContactRecord)
    add(structuredName.contentValues)

    val organization = toNewOrganization(createContactRecord)
    if (organization.company != null || organization.department != null || organization.jobTitle != null || organization.phoneticName != null) {
      add(organization.contentValues)
    }

    val note = toNewNote(createContactRecord)
    if (note.note != null) {
      add(note.contentValues)
    }

    createContactRecord.emails?.map { emailRecord ->
      EmailMapper.toNew(emailRecord).contentValues
    }?.let {
      addAll(it)
    }

    createContactRecord.phones?.map { phoneRecord ->
      PhoneMapper.toNew(phoneRecord).contentValues
    }?.let {
      addAll(it)
    }

    createContactRecord.dates?.map { dateRecord ->
      EventMapper.toNew(dateRecord).contentValues
    }?.let {
      addAll(it)
    }

    createContactRecord.addresses?.map { addressRecord ->
      StructuredPostalMapper.toNew(addressRecord).contentValues
    }?.let {
      addAll(it)
    }

    createContactRecord.relations?.map { relationRecord ->
      RelationMapper.toNew(relationRecord).contentValues
    }?.let {
      addAll(it)
    }

    createContactRecord.urlAddresses?.map { urlRecord ->
      WebsiteMapper.toNew(urlRecord).contentValues
    }?.let {
      addAll(it)
    }

    createContactRecord.extraNames?.map { extraNameRecord ->
      NicknameMapper.toNew(extraNameRecord).contentValues
    }?.let {
      addAll(it)
    }
  }
}
