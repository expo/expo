package expo.modules.contacts.next

import android.net.Uri
import android.provider.ContactsContract
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.domain.model.event.EventField
import expo.modules.contacts.next.domain.model.event.operations.ExistingEvent
import expo.modules.contacts.next.domain.model.email.EmailField
import expo.modules.contacts.next.domain.model.phone.PhoneField
import expo.modules.contacts.next.domain.model.relationship.RelationField
import expo.modules.contacts.next.domain.model.nickname.NicknameField
import expo.modules.contacts.next.domain.model.phone.operations.ExistingPhone
import expo.modules.contacts.next.domain.model.relationship.operations.ExistingRelation
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalField
import expo.modules.contacts.next.domain.model.website.operations.ExistingWebsite
import expo.modules.contacts.next.domain.model.website.WebsiteField
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.note.NoteField
import expo.modules.contacts.next.domain.model.organization.OrganizationField
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameField
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.records.contact.PatchContactRecord
import expo.modules.contacts.next.records.contact.CreateContactRecord
import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.RelationshipRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.contacts.next.services.ListPropertyManager
import expo.modules.contacts.next.services.PropertyManager
import expo.modules.contacts.next.services.property.NoteProperty
import expo.modules.contacts.next.services.property.OrganizationProperty
import expo.modules.contacts.next.services.property.StructuredNameProperty
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class Contact(
  val contactId: ContactId,
  val repository: ContactRepository,
  val mapper: ContactRecordDomainMapper,
  val intentDelegate: ContactIntentDelegate
) : SharedObject() {
  suspend fun delete(): Boolean {
    return repository.delete(contactId)
  }

  suspend fun patch(patchContactRecord: PatchContactRecord): Boolean {
    val existingContact = repository.getById(
      setOf(StructuredNameField, OrganizationField),
      contactId
    )
    val rawContactId = repository.getRawContactId(contactId)
      ?: throw RawContactIdNotFoundException()
    val contactPatch = mapper.toPatchContact(
      patchContactRecord,
      rawContactId,
      contactId,
      existingContact.structuredName?.dataId,
      existingContact.organization?.dataId,
      existingContact.note?.dataId
    )
    return repository.patch(contactPatch)
  }

  suspend fun getDetails(fields: Set<ContactField>?): GetContactDetailsRecord {
    val extractableFields = fields
      ?.map { mapper.toExtractableField(it) }
      ?.toSet()
      ?: setOf(StructuredNameField, OrganizationField, EmailField, PhoneField, StructuredPostalField, EventField, RelationField, WebsiteField, NicknameField)
    val existingContact = repository.getById(extractableFields, contactId)
    return mapper.toRecord(existingContact)
  }

  suspend fun editWithForm() = withContext(Dispatchers.IO) {
    intentDelegate.launchEditContact(getLookupKeyUri())
  }

  private suspend fun getLookupKeyUri(): Uri = withContext(Dispatchers.IO) {
    val lookupKey = repository.getLookupKey(contactId)
    return@withContext ContactsContract.Contacts.getLookupUri(contactId.value.toLong(), lookupKey)
  }

  val givenName = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.GivenName,
    repository = repository,
    contactId = contactId
  )

  val familyName = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.FamilyName,
    repository = repository,
    contactId = contactId
  )

  val middleName = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.MiddleName,
    repository = repository,
    contactId = contactId
  )

  val prefix = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.Prefix,
    repository = repository,
    contactId = contactId
  )

  val suffix = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.Suffix,
    repository = repository,
    contactId = contactId
  )

  val phoneticGivenName = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.PhoneticGivenName,
    repository = repository,
    contactId = contactId
  )

  val phoneticFamilyName = PropertyManager(
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.PhoneticFamilyName,
    repository = repository,
    contactId = contactId
  )

  val phoneticMiddleName = PropertyManager(
    contactId = contactId,
    field = StructuredNameField,
    fieldPropertyAccessor = StructuredNameProperty.PhoneticMiddleName,
    repository = repository
  )

  val company = PropertyManager(
    contactId = contactId,
    field = OrganizationField,
    fieldPropertyAccessor = OrganizationProperty.Company,
    repository = repository
  )

  val department = PropertyManager(
    contactId = contactId,
    field = OrganizationField,
    fieldPropertyAccessor = OrganizationProperty.Department,
    repository = repository
  )

  val jobTitle = PropertyManager(
    contactId = contactId,
    field = OrganizationField,
    fieldPropertyAccessor = OrganizationProperty.JobTitle,
    repository = repository
  )

  val phoneticCompanyName = PropertyManager(
    contactId = contactId,
    field = OrganizationField,
    fieldPropertyAccessor = OrganizationProperty.PhoneticName,
    repository = repository
  )

  val note = PropertyManager(
    contactId = contactId,
    field = NoteField,
    fieldPropertyAccessor = NoteProperty.Note,
    repository = repository
  )

  val emails = ListPropertyManager<ExistingEmail, EmailRecord.New, EmailRecord.Existing>(
    EmailField,
    contactId,
    repository,
    mapper
  )

  val phones = ListPropertyManager<ExistingPhone, PhoneRecord.New, PhoneRecord.Existing>(
    PhoneField,
    contactId,
    repository,
    mapper
  )

  val addresses = ListPropertyManager<ExistingStructuredPostal, PostalAddressRecord.New, PostalAddressRecord.Existing>(
    StructuredPostalField,
    contactId,
    repository,
    mapper
  )

  val dates = ListPropertyManager<ExistingEvent, DateRecord.New, DateRecord.Existing>(
    EventField,
    contactId,
    repository,
    mapper
  )

  val urlAddresses = ListPropertyManager<ExistingWebsite, UrlAddressRecord.New, UrlAddressRecord.Existing>(
    WebsiteField,
    contactId,
    repository,
    mapper
  )

  val relations = ListPropertyManager<ExistingRelation, RelationshipRecord.New, RelationshipRecord.Existing>(
    RelationField,
    contactId,
    repository,
    mapper
  )

  val extraNames = ListPropertyManager<ExistingNickname, ExtraNameRecord.New, ExtraNameRecord.Existing>(
    NicknameField,
    contactId,
    repository,
    mapper
  )

  companion object {
    suspend fun create(
      createContactRecord: CreateContactRecord,
      contactRepository: ContactRepository,
      contactMapper: ContactRecordDomainMapper,
      contactFactory: ContactFactory
    ): Contact {
      val contactModelNew = contactMapper.toDomain(createContactRecord)
      val contactId = contactRepository.insert(contactModelNew)
      return contactFactory.create(contactId)
    }

    suspend fun createWithForm(
      createContactRecord: CreateContactRecord,
      contactMapper: ContactRecordDomainMapper,
      contactIntentDelegate: ContactIntentDelegate
    ): Boolean {
      val contentValues = contactMapper.toContentValues(createContactRecord)
      return contactIntentDelegate.launchAddContact(contentValues)
    }

    suspend fun getAll(
      contactRepository: ContactRepository,
      contactFactory: ContactFactory
    ): List<Contact> =
      contactRepository
        .getAllIds()
        .map { contactFactory.create(it) }

    suspend fun getAllWithDetails(
      contactRepository: ContactRepository,
      contactMapper: ContactRecordDomainMapper,
      fields: List<ContactField>
    ): List<GetContactDetailsRecord> {
      val extractableFields = fields
        .map { contactMapper.toExtractableField(it) }
        .toSet()
      return contactRepository
        .getAll(extractableFields)
        .map { contactMapper.toRecord(it) }
    }

    suspend fun pick(
      contactIntentDelegate: ContactIntentDelegate,
      contactFactory: ContactFactory
    ): Contact? {
      return contactIntentDelegate.launchPickContact()
        ?.let { uri ->
          val contactIdString = uri.lastPathSegment
            ?: throw UnableToExtractIdFromUriException(uri)
          contactFactory.create(contactIdString)
        }
    }
  }
}
