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
import expo.modules.contacts.next.domain.model.headers.starred.ExistingStarred
import expo.modules.contacts.next.domain.model.headers.starred.PatchStarred
import expo.modules.contacts.next.domain.model.headers.starred.StarredField
import expo.modules.contacts.next.domain.model.nickname.NicknameField
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.note.NoteField
import expo.modules.contacts.next.domain.model.note.operations.AppendableNote
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
import expo.modules.contacts.next.mappers.domain.data.list.EmailMapper
import expo.modules.contacts.next.mappers.domain.data.list.EventMapper
import expo.modules.contacts.next.mappers.domain.data.list.NicknameMapper
import expo.modules.contacts.next.mappers.domain.data.list.PhoneMapper
import expo.modules.contacts.next.mappers.domain.data.list.RelationMapper
import expo.modules.contacts.next.mappers.domain.data.list.StructuredPostalMapper
import expo.modules.contacts.next.mappers.domain.data.list.WebsiteMapper
import expo.modules.contacts.next.records.*
import expo.modules.contacts.next.records.contact.*
import expo.modules.contacts.next.records.fields.*
import expo.modules.contacts.next.services.ImageByteArrayConverter
import expo.modules.kotlin.apifeatures.EitherType

class ContactRecordDomainMapper(imageByteArrayConverter: ImageByteArrayConverter){
  val contactMapper = ContactMapper(imageByteArrayConverter)

  fun toRecord(existingContact: ExistingContact): GetContactDetailsRecord =
    contactMapper.toRecord(existingContact)

  fun toAppendable(record: NewRecord, rawContactId: RawContactId): Appendable {
    return when (record) {
      is EmailRecord.New -> EmailMapper.toAppendable(record, rawContactId)
      is PhoneRecord.New -> PhoneMapper.toAppendable(record, rawContactId)
      is DateRecord.New -> EventMapper.toAppendable(record, rawContactId)
      is ExtraNameRecord.New -> NicknameMapper.toAppendable(record, rawContactId)
      is AddressRecord.New -> StructuredPostalMapper.toAppendable(record, rawContactId)
      is RelationRecord.New -> RelationMapper.toAppendable(record, rawContactId)
      is UrlAddressRecord.New -> WebsiteMapper.toAppendable(record, rawContactId)
      else -> throw IllegalArgumentException("Unsupported 'NewRecord' type: ${record::class.simpleName}")
    }
  }

  fun toUpdatable(record: ExistingRecord): Updatable {
    return when (record) {
      is EmailRecord.Existing -> EmailMapper.toUpdatable(record)
      is PhoneRecord.Existing -> PhoneMapper.toUpdatable(record)
      is DateRecord.Existing -> EventMapper.toUpdatable(record)
      is ExtraNameRecord.Existing -> NicknameMapper.toUpdatable(record)
      is AddressRecord.Existing -> StructuredPostalMapper.toUpdatable(record)
      is RelationRecord.Existing -> RelationMapper.toUpdatable(record)
      is UrlAddressRecord.Existing -> WebsiteMapper.toUpdatable(record)
      else -> throw IllegalArgumentException("Unsupported 'ExistingRecord' type: ${record::class.simpleName}")
    }
  }

  fun toPatchable(record: PatchRecord): Updatable {
    return when (record) {
      is EmailRecord.Patch -> EmailMapper.toPatch(record)
      is PhoneRecord.Patch -> PhoneMapper.toPatch(record)
      is DateRecord.Patch -> EventMapper.toPatch(record)
      is ExtraNameRecord.Patch -> NicknameMapper.toPatch(record)
      is AddressRecord.Patch -> StructuredPostalMapper.toPatch(record)
      is RelationRecord.Patch -> RelationMapper.toPatch(record)
      is UrlAddressRecord.Patch -> WebsiteMapper.toPatch(record)
      else -> throw IllegalArgumentException("Unsupported 'PatchRecord' type: ${record::class.simpleName}")
    }
  }

  fun toExtractableFields(contactFields: Collection<ContactField>) =
    contactFields.mapNotNull {
      when (it) {
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
        // filters iOS fields
        ContactField.NICKNAME,
        ContactField.MAIDEN_NAME,
        ContactField.IM_ADDRESS,
        ContactField.SOCIAL_PROFILES
          -> null
      }
    }

  @Suppress("UNCHECKED_CAST")
  fun <TRecord : ExistingRecord, TModel : Extractable> toRecord(model: TModel): TRecord {
    return when (model) {
      is ExistingEmail -> EmailMapper.toDto(model)
      is ExistingPhone -> PhoneMapper.toDto(model)
      is ExistingEvent -> EventMapper.toDto(model)
      is ExistingNickname -> NicknameMapper.toDto(model)
      is ExistingStructuredPostal -> StructuredPostalMapper.toDto(model)
      is ExistingRelation -> RelationMapper.toDto(model)
      is ExistingWebsite -> WebsiteMapper.toDto(model)
      else -> throw IllegalArgumentException("Unsupported model type for mapping to record")
    } as TRecord
  }

  fun toDomain(record: CreateContactRecord): NewContact {
    val modelsToInsert = buildList {
      add(contactMapper.toNewStructuredName(record))
      add(contactMapper.toNewOrganization(record))
      add(contactMapper.toNewNote(record))
      add(contactMapper.toNewPhoto(record))
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

  fun toUpdateContact(
    record: CreateContactRecord,
    contactId: ContactId,
    rawContactId: RawContactId,
  ): UpdateContact {
    val modelsToAppend = buildList {
      add(contactMapper.toAppendableStructuredName(record, rawContactId))
      add(contactMapper.toAppendableOrganization(record, rawContactId))
      add(AppendableNote(rawContactId, record.note))
      add(contactMapper.toAppendablePhoto(record, rawContactId))
      record.emails?.let { addAll(it.map { email -> EmailMapper.toAppendable(email, rawContactId) }) }
      record.phones?.let { addAll(it.map { phone -> PhoneMapper.toAppendable(phone, rawContactId) }) }
      record.dates?.let { addAll(it.map { date -> EventMapper.toAppendable(date, rawContactId)}) }
      record.extraNames?.let { addAll(it.map { extraName -> NicknameMapper.toAppendable(extraName, rawContactId)}) }
      record.addresses?.let { addAll(it.map { address -> StructuredPostalMapper.toAppendable(address, rawContactId)}) }
      record.relations?.let { addAll(it.map { relation -> RelationMapper.toAppendable(relation, rawContactId) }) }
      record.urlAddresses?.let { addAll(it.map { urlAddress -> WebsiteMapper.toAppendable(urlAddress, rawContactId)}) }
    }
    val existingStarred = ExistingStarred(contactId, record.isFavourite)
    return UpdateContact(rawContactId, existingStarred, modelsToAppend)
  }

  @OptIn(EitherType::class)
  fun toPatchContact(
    record: PatchContactRecord,
    rawContactId: RawContactId,
    contactId: ContactId,
    structuredNameDataId: DataId?,
    organizationDataId: DataId?,
    noteDataId: DataId?,
    photoDataId: DataId?
  ) = with(ContactPatchBuilder(contactId, rawContactId, this)) {
    if (record.isChangingStructuredName()) {
      if (structuredNameDataId != null) {
        withUpdatable(contactMapper.toPatchStructuredName(record, structuredNameDataId))
      } else {
        withAppendable(contactMapper.toAppendableStructuredName(record, rawContactId))
      }
    }
    if (record.isChangingOrganization()) {
      if (organizationDataId != null) {
        withUpdatable(contactMapper.toPatchOrganization(record, organizationDataId))
      } else {
        withAppendable(contactMapper.toAppendableOrganization(record, rawContactId))
      }
    }

    if (!record.note.isUndefined) {
      if (noteDataId != null) {
        withUpdatable(contactMapper.toPatchNote(record, noteDataId))
      } else {
        withAppendable(contactMapper.toAppendableNote(record, rawContactId))
      }
    }

    if (!record.image.isUndefined) {
      if (photoDataId != null) {
        withUpdatable(contactMapper.toPatchPhoto(record, photoDataId))
      } else {
        withAppendable(contactMapper.toAppendablePhoto(record, rawContactId))
      }
    }
    if (!record.isFavourite.isUndefined) {
      withUpdatable(PatchStarred(contactId, record.isFavourite))
    }
    withListProperty(record.emails, EmailField)
    withListProperty(record.phones, PhoneField)
    withListProperty(record.dates, EventField)
    withListProperty(record.extraNames, NicknameField)
    withListProperty(record.addresses, StructuredPostalField)
    withListProperty(record.relations, RelationField)
    withListProperty(record.urlAddresses, WebsiteField)
    build()
  }

  fun toContentValues(createContactRecord: CreateContactRecord) = buildList {
    val structuredName = contactMapper.toNewStructuredName(createContactRecord)
    add(structuredName.contentValues)

    val organization = contactMapper.toNewOrganization(createContactRecord)
    if (organization.company != null || organization.department != null || organization.jobTitle != null || organization.phoneticName != null) {
      add(organization.contentValues)
    }

    val note = contactMapper.toNewNote(createContactRecord)
    if (note.note != null) {
      add(note.contentValues)
    }

    val photo = contactMapper.toNewPhoto(createContactRecord)
    if (photo.photo != null) {
      add(photo.contentValues)
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
