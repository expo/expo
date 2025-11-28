package expo.modules.contacts.next.mappers

import androidx.core.net.toUri
import expo.modules.contacts.next.domain.model.contact.ExistingContact
import expo.modules.contacts.next.domain.model.note.operations.AppendableNote
import expo.modules.contacts.next.domain.model.note.operations.NewNote
import expo.modules.contacts.next.domain.model.note.operations.PatchNote
import expo.modules.contacts.next.domain.model.organization.operations.AppendableOrganization
import expo.modules.contacts.next.domain.model.organization.operations.NewOrganization
import expo.modules.contacts.next.domain.model.organization.operations.PatchOrganization
import expo.modules.contacts.next.domain.model.photo.operations.NewPhoto
import expo.modules.contacts.next.domain.model.structuredname.operations.AppendableStructuredName
import expo.modules.contacts.next.domain.model.structuredname.operations.NewStructuredName
import expo.modules.contacts.next.domain.model.structuredname.operations.PatchStructuredName
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.mappers.model.EmailMapper
import expo.modules.contacts.next.mappers.model.EventMapper
import expo.modules.contacts.next.mappers.model.NicknameMapper
import expo.modules.contacts.next.mappers.model.PhoneMapper
import expo.modules.contacts.next.mappers.model.RelationMapper
import expo.modules.contacts.next.mappers.model.StructuredPostalMapper
import expo.modules.contacts.next.mappers.model.WebsiteMapper
import expo.modules.contacts.next.records.contact.CreateContactRecord
import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.contact.PatchContactRecord
import expo.modules.contacts.next.services.ImageByteArrayConverter

object ContactMapper {
  fun toRecord(existingContact: ExistingContact) =
    GetContactDetailsRecord(
      id = existingContact.contactId.value,
      givenName = existingContact.structuredName?.givenName,
      middleName = existingContact.structuredName?.middleName,
      familyName = existingContact.structuredName?.familyName,
      prefix = existingContact.structuredName?.prefix,
      suffix = existingContact.structuredName?.suffix,
      phoneticGivenName = existingContact.structuredName?.phoneticGivenName,
      phoneticMiddleName = existingContact.structuredName?.phoneticMiddleName,
      phoneticFamilyName = existingContact.structuredName?.phoneticFamilyName,
      company = existingContact.organization?.company,
      department = existingContact.organization?.department,
      jobTitle = existingContact.organization?.jobTitle,
      image = existingContact.photoUri?.value,
      emails = existingContact.emails.map(EmailMapper::toRecord),
      dates = existingContact.events.map(EventMapper::toRecord),
      phones = existingContact.phones.map(PhoneMapper::toRecord),
      addresses = existingContact.structuredPostals.map(StructuredPostalMapper::toRecord),
      relations = existingContact.relations.map(RelationMapper::toRecord),
      urlAddresses = existingContact.websites.map(WebsiteMapper::toRecord),
      extraNames = existingContact.nicknames.map(NicknameMapper::toRecord)
    )

  fun toNewStructuredName(record: CreateContactRecord) =
    NewStructuredName(
      givenName = record.givenName,
      middleName = record.middleName,
      familyName = record.familyName,
      prefix = record.prefix,
      suffix = record.suffix,
      phoneticGivenName = record.phoneticGivenName,
      phoneticMiddleName = record.phoneticMiddleName,
      phoneticFamilyName = record.phoneticFamilyName
    )

  fun toAppendableStructuredName(record: PatchContactRecord, rawContactId: RawContactId) =
    AppendableStructuredName(
      rawContactId = rawContactId,
      givenName = record.givenName.optional,
      middleName = record.middleName.optional,
      familyName = record.familyName.optional,
      prefix = record.prefix.optional,
      suffix = record.suffix.optional,
      phoneticGivenName = record.phoneticGivenName.optional,
      phoneticMiddleName = record.phoneticMiddleName.optional,
      phoneticFamilyName = record.phoneticFamilyName.optional
    )

  fun toPatchStructuredName(record: PatchContactRecord, structuredNameDataId: DataId) =
    PatchStructuredName(
      dataId = structuredNameDataId,
      givenName = record.givenName,
      middleName = record.middleName,
      familyName = record.familyName,
      prefix = record.prefix,
      suffix = record.suffix,
      phoneticGivenName = record.phoneticGivenName,
      phoneticMiddleName = record.phoneticMiddleName,
      phoneticFamilyName = record.phoneticFamilyName
    )

  fun toNewOrganization(record: CreateContactRecord) =
    NewOrganization(
      company = record.company,
      department = record.department,
      jobTitle = record.jobTitle,
      phoneticName = record.phoneticOrganizationName
    )

  fun toAppendableOrganization(record: PatchContactRecord, rawContactId: RawContactId) =
    AppendableOrganization(
      rawContactId = rawContactId,
      company = record.company.optional,
      department = record.department.optional,
      jobTitle = record.jobTitle.optional,
      phoneticName = record.phoneticOrganizationName.optional
    )

  fun toPatchOrganization(record: PatchContactRecord, organizationDataId: DataId) =
    PatchOrganization(
      dataId = organizationDataId,
      company = record.company,
      department = record.department,
      jobTitle = record.jobTitle,
      phoneticName = record.phoneticOrganizationName
    )

  fun toAppendableNote(record: PatchContactRecord, rawContactId: RawContactId) =
    AppendableNote(
      rawContactId = rawContactId,
      note = record.note.optional
    )

  fun toPatchNote(record: PatchContactRecord, noteDataId: DataId) =
    PatchNote(
      dataId = noteDataId,
      note = record.note
    )

  fun toNewNote(record: CreateContactRecord) =
    NewNote(
      note = record.note
    )

  fun toNewPhoto(record: CreateContactRecord, imageByteArrayConverter: ImageByteArrayConverter) =

    NewPhoto(
      photo = record.image?.let {
        imageByteArrayConverter.toByteArray(it.toUri())
      }
    )
}
