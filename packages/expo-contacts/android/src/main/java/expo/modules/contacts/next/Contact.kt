package expo.modules.contacts.next

import android.net.Uri
import android.provider.ContactsContract
import androidx.core.net.toUri
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
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.email.operations.ExistingEmail
import expo.modules.contacts.next.domain.model.headers.DisplayNameField
import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUriField
import expo.modules.contacts.next.domain.model.headers.PhotoUriField
import expo.modules.contacts.next.domain.model.headers.isfavourite.PatchIsFavourite
import expo.modules.contacts.next.domain.model.headers.isfavourite.Starred
import expo.modules.contacts.next.domain.model.headers.isfavourite.StarredField
import expo.modules.contacts.next.domain.model.nickname.operations.ExistingNickname
import expo.modules.contacts.next.domain.model.note.NoteField
import expo.modules.contacts.next.domain.model.organization.OrganizationField
import expo.modules.contacts.next.domain.model.photo.PhotoField
import expo.modules.contacts.next.domain.model.photo.operations.AppendablePhoto
import expo.modules.contacts.next.domain.model.photo.operations.ExistingPhoto
import expo.modules.contacts.next.domain.model.structuredname.StructuredNameField
import expo.modules.contacts.next.domain.model.structuredpostal.operations.ExistingStructuredPostal
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.records.contact.PatchContactRecord
import expo.modules.contacts.next.records.contact.CreateContactRecord
import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.RelationRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.contacts.next.services.ImageByteArrayConverter
import expo.modules.contacts.next.services.properties.ListDataProperty
import expo.modules.contacts.next.services.properties.SingleDataProperty
import expo.modules.contacts.next.services.properties.MutableHeaderProperty
import expo.modules.contacts.next.services.properties.ReadOnlyHeaderProperty
import expo.modules.contacts.next.services.property.NoteMapper
import expo.modules.contacts.next.services.property.OrganizationPropertyMapper
import expo.modules.contacts.next.services.property.PropertyMapper
import expo.modules.contacts.next.services.property.StructuredNamePropertyMapper
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
    ) ?: throw ContactNotFoundException()
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

  private fun <TDomain: Extractable.Data, TDto> singleDataProperty(
    field: ExtractableField.Data<TDomain>,
    mapper: PropertyMapper<TDomain, TDto>,
  ) = SingleDataProperty(contactId, field, mapper, repository)

  val givenName = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.GivenName)
  val familyName = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.FamilyName)
  val middleName = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.MiddleName)
  val prefix = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.Prefix)
  val suffix = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.Suffix)
  val phoneticGivenName = singleDataProperty(StructuredNameField,StructuredNamePropertyMapper.PhoneticGivenName)
  val phoneticFamilyName = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.PhoneticFamilyName)
  val phoneticMiddleName = singleDataProperty(StructuredNameField, StructuredNamePropertyMapper.PhoneticMiddleName)
  val company = singleDataProperty(OrganizationField, OrganizationPropertyMapper.Company)
  val department = singleDataProperty(OrganizationField, OrganizationPropertyMapper.Department)
  val jobTitle = singleDataProperty(OrganizationField, OrganizationPropertyMapper.JobTitle)
  val phoneticCompanyName = singleDataProperty(OrganizationField, OrganizationPropertyMapper.PhoneticName)
  val note = singleDataProperty(NoteField, NoteMapper)
  val fullName = ReadOnlyHeaderProperty(contactId, repository, DisplayNameField, mapToDto = {v -> v.value})
  val thumbnail = ReadOnlyHeaderProperty(contactId, repository, PhotoThumbnailUriField) { v -> v.value }

  val imageUri = ReadOnlyHeaderProperty(contactId, repository, PhotoUriField) { v -> v.value }

  val image = singleDataProperty(PhotoField,  object: PropertyMapper<ExistingPhoto, String> {
    override fun toUpdatable(dataId: DataId, newValue: String?): Updatable.Data {
      val converter = ImageByteArrayConverter(appContext?.reactContext?.contentResolver ?: throw ContentResolverNotObtainedException())
      val byteArray = newValue?.let {
        converter.toByteArray(it.toUri())
      }
      return ExistingPhoto(dataId, byteArray)
    }

    override fun toAppendable(newValue: String?, rawContactId: RawContactId): Appendable {
      val converter = ImageByteArrayConverter(appContext?.reactContext?.contentResolver ?: throw ContentResolverNotObtainedException())
      val byteArray = newValue?.let {
        converter.toByteArray(it.toUri())
      }
      return AppendablePhoto(rawContactId, byteArray)
    }

    override fun toDto(model: ExistingPhoto): String? {
      return ""
    }
  })

  val isFavourite = MutableHeaderProperty(
    contactId, repository,
    field = StarredField,
    mapToDto = { value: Starred -> value.value == 1 },
    mapToUpdatable = { boolean: Boolean -> PatchIsFavourite(contactId) }
  )

  val emails = ListDataProperty<ExistingEmail, EmailRecord.New, EmailRecord.Existing>(
    EmailField,
    contactId,
    repository,
    mapper
  )

  val phones = ListDataProperty<ExistingPhone, PhoneRecord.New, PhoneRecord.Existing>(
    PhoneField,
    contactId,
    repository,
    mapper
  )

  val addresses = ListDataProperty<ExistingStructuredPostal, PostalAddressRecord.New, PostalAddressRecord.Existing>(
    StructuredPostalField,
    contactId,
    repository,
    mapper
  )

  val dates = ListDataProperty<ExistingEvent, DateRecord.New, DateRecord.Existing>(
    EventField,
    contactId,
    repository,
    mapper
  )

  val urlAddresses = ListDataProperty<ExistingWebsite, UrlAddressRecord.New, UrlAddressRecord.Existing>(
    WebsiteField,
    contactId,
    repository,
    mapper
  )

  val relations = ListDataProperty<ExistingRelation, RelationRecord.New, RelationRecord.Existing>(
    RelationField,
    contactId,
    repository,
    mapper
  )

  val extraNames = ListDataProperty<ExistingNickname, ExtraNameRecord.New, ExtraNameRecord.Existing>(
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
