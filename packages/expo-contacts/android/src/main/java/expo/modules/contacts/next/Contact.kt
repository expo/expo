package expo.modules.contacts.next

import android.net.Uri
import android.provider.ContactsContract
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.domain.model.event.EventField
import expo.modules.contacts.next.domain.model.email.EmailField
import expo.modules.contacts.next.domain.model.phone.PhoneField
import expo.modules.contacts.next.domain.model.relationship.RelationField
import expo.modules.contacts.next.domain.model.nickname.NicknameField
import expo.modules.contacts.next.domain.model.structuredpostal.StructuredPostalField
import expo.modules.contacts.next.domain.model.website.WebsiteField
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.headers.DisplayNameField
import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUriField
import expo.modules.contacts.next.domain.model.headers.PhotoUriField
import expo.modules.contacts.next.domain.model.headers.starred.StarredField
import expo.modules.contacts.next.domain.model.note.NoteField
import expo.modules.contacts.next.domain.model.organization.OrganizationField
import expo.modules.contacts.next.domain.model.photo.PhotoField
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.mappers.domain.contacts.ContactsPropertyMapper
import expo.modules.contacts.next.mappers.domain.contacts.DisplayNameMapper
import expo.modules.contacts.next.mappers.domain.contacts.StarredMapper
import expo.modules.contacts.next.mappers.domain.contacts.MutableContactsPropertyMapper
import expo.modules.contacts.next.mappers.domain.contacts.PhotoThumbnailUriMapper
import expo.modules.contacts.next.mappers.domain.contacts.PhotoUriMapper
import expo.modules.contacts.next.mappers.domain.data.MutableDataPropertyMapper
import expo.modules.contacts.next.mappers.domain.data.NoteMapper
import expo.modules.contacts.next.mappers.domain.data.list.EmailMapper
import expo.modules.contacts.next.records.ContactQueryOptions
import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.contact.PatchContactRecord
import expo.modules.contacts.next.records.contact.CreateContactRecord
import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.contacts.next.services.properties.ListDataProperty
import expo.modules.contacts.next.services.properties.MutableDataProperty
import expo.modules.contacts.next.services.properties.ContactsProperty
import expo.modules.contacts.next.services.properties.MutableContactsProperty
import expo.modules.contacts.next.mappers.domain.data.OrganizationPropertyMapper
import expo.modules.contacts.next.mappers.domain.data.PhotoPropertyMapper
import expo.modules.contacts.next.mappers.domain.data.StructuredNamePropertyMapper
import expo.modules.contacts.next.mappers.domain.data.list.EventMapper
import expo.modules.contacts.next.mappers.domain.data.list.ListDataPropertyMapper
import expo.modules.contacts.next.mappers.domain.data.list.NicknameMapper
import expo.modules.contacts.next.mappers.domain.data.list.PhoneMapper
import expo.modules.contacts.next.mappers.domain.data.list.RelationMapper
import expo.modules.contacts.next.mappers.domain.data.list.StructuredPostalMapper
import expo.modules.contacts.next.mappers.domain.data.list.WebsiteMapper
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class Contact(
  val contactId: ContactId,
  val repository: ContactRepository,
  val mapper: ContactRecordDomainMapper,
  val photoPropertyMapper: PhotoPropertyMapper,
  val intentDelegate: ContactIntentDelegate
) : SharedObject() {
  val givenName = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.GivenName)
  val familyName = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.FamilyName)
  val middleName = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.MiddleName)
  val prefix = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.Prefix)
  val suffix = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.Suffix)
  val phoneticGivenName = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.PhoneticGivenName)
  val phoneticFamilyName = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.PhoneticFamilyName)
  val phoneticMiddleName = mutableDataProperty(field = StructuredNameField, mapper = StructuredNamePropertyMapper.PhoneticMiddleName)
  val company = mutableDataProperty(field = OrganizationField, mapper = OrganizationPropertyMapper.Company)
  val department = mutableDataProperty(field = OrganizationField, mapper = OrganizationPropertyMapper.Department)
  val jobTitle = mutableDataProperty(field = OrganizationField, mapper = OrganizationPropertyMapper.JobTitle)
  val phoneticCompanyName = mutableDataProperty(field = OrganizationField, mapper = OrganizationPropertyMapper.PhoneticName)
  val note = mutableDataProperty(field = NoteField, mapper = NoteMapper)
  val image = mutableDataProperty(field = PhotoField, mapper = photoPropertyMapper)

  val fullName = contactsProperty(field = DisplayNameField, mapper = DisplayNameMapper)
  val thumbnail = contactsProperty(field = PhotoThumbnailUriField, mapper = PhotoThumbnailUriMapper)
  val imageUri = contactsProperty(field = PhotoUriField, mapper = PhotoUriMapper)

  val isFavourite = mutableContactsProperty(field = StarredField, mapper = StarredMapper)

  val emails = listDataProperty(field = EmailField, mapper = EmailMapper)
  val phones = listDataProperty(field = PhoneField, mapper = PhoneMapper)
  val addresses = listDataProperty(field = StructuredPostalField, mapper = StructuredPostalMapper)
  val dates = listDataProperty(field = EventField, mapper = EventMapper)
  val urlAddresses = listDataProperty(field = WebsiteField, mapper = WebsiteMapper)
  val relations = listDataProperty(RelationField, RelationMapper)
  val extraNames = listDataProperty(NicknameField, NicknameMapper)

  suspend fun delete(): Boolean {
    return repository.delete(contactId)
  }

  suspend fun patch(patchContactRecord: PatchContactRecord): Boolean {
    // To patch a contact, we first need to fetch singular fields.
    // If a field exists, we patch it; otherwise, we create a new one.
    val existingContact = repository.getById(
      setOf(StructuredNameField, OrganizationField, NoteField, PhotoField),
      contactId
    ) ?: throw ContactNotFoundException()
    val rawContactId = repository.getRawContactId(contactId)
      ?: throw RawContactIdNotFoundException()
    val contactPatch = mapper.toPatchContact(
      record = patchContactRecord,
      rawContactId = rawContactId,
      contactId = contactId,
      structuredNameDataId = existingContact.structuredName?.dataId,
      organizationDataId = existingContact.organization?.dataId,
      noteDataId = existingContact.note?.dataId,
      photoDataId = existingContact.photo?.dataId
    )
    return repository.patch(contactPatch)
  }

  suspend fun update(newContactRecord: CreateContactRecord): Boolean {
    val rawContactId = repository.getRawContactId(contactId)
      ?: throw RawContactIdNotFoundException()
    val updateContact = mapper.toUpdateContact(newContactRecord, contactId, rawContactId)
    return repository.update(updateContact)
  }

  suspend fun getDetails(fields: Set<ContactField>?): GetContactDetailsRecord {
    val extractableFields = fields?.let { mapper.toExtractableFields(fields).toSet() }
      ?: ExtractableField.getAll()
    val existingContact = repository.getById(extractableFields, contactId)
      ?: throw ContactNotFoundException()
    return mapper.toRecord(existingContact)
  }

  suspend fun editWithForm() = withContext(Dispatchers.IO) {
    intentDelegate.launchEditContact(getLookupKeyUri())
  }

  private suspend fun getLookupKeyUri(): Uri = withContext(Dispatchers.IO) {
    val lookupKey = repository.getLookupKey(contactId)
    return@withContext ContactsContract.Contacts.getLookupUri(contactId.value.toLong(), lookupKey)
  }

  private fun <TDomain : Extractable.Data, TDto> mutableDataProperty(
    field: ExtractableField.Data<TDomain>,
    mapper: MutableDataPropertyMapper<TDomain, TDto>
  ) = MutableDataProperty(field, mapper, contactId, repository)

  private fun <TDomain : Extractable.Data, TExistingDto : ExistingRecord, TNewDto : NewRecord> listDataProperty(
    field: ExtractableField.Data<TDomain>,
    mapper: ListDataPropertyMapper<TDomain, TExistingDto, TNewDto>
  ) = ListDataProperty(field, mapper, contactId, repository)

  private fun <TDomain : Extractable, TDto> contactsProperty(
    field: ExtractableField.Contacts<TDomain>,
    mapper: ContactsPropertyMapper<TDomain, TDto>
  ) = ContactsProperty(field, mapper, contactId, repository)

  private fun <TDomain : Extractable, TDto> mutableContactsProperty(
    field: ExtractableField.Contacts<TDomain>,
    mapper: MutableContactsPropertyMapper<TDomain, TDto>
  ) = MutableContactsProperty(field, mapper, contactId, repository)

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
      contactFactory: ContactFactory,
      contactQueryOptions: ContactQueryOptions?
    ): List<Contact> =
      contactRepository
        .getAllIds(
          limit = contactQueryOptions?.limit,
          offset = contactQueryOptions?.offset,
          searchedDisplayName = contactQueryOptions?.name,
          sortOrder = contactQueryOptions?.sortOrder
        )
        .map { contactFactory.create(it) }

    suspend fun getAllWithDetails(
      contactRepository: ContactRepository,
      contactMapper: ContactRecordDomainMapper,
      fields: Set<ContactField>,
      contactQueryOptions: ContactQueryOptions?
    ): List<GetContactDetailsRecord> {
      val extractableFields = contactMapper.toExtractableFields(fields).toSet()
      return contactRepository
        .getAllPaginated(
          extractableFields = extractableFields,
          limit = contactQueryOptions?.limit,
          offset = contactQueryOptions?.offset,
          searchedDisplayName = contactQueryOptions?.name,
          sortOrder = contactQueryOptions?.sortOrder
        )
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

    suspend fun hasAny(contactRepository: ContactRepository) =
      contactRepository.getCount() > 0

    suspend fun getCount(contactRepository: ContactRepository) =
      contactRepository.getCount()
  }
}
