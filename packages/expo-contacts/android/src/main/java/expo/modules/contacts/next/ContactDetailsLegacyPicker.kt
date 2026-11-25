package expo.modules.contacts.next

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.intents.ContactDetailsPickerRequest
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField

class ContactDetailsLegacyPicker(
  private val intentDelegate: ContactIntentDelegate,
  private val repository: ContactRepository,
  private val mapper: ContactRecordDomainMapper,
  private val permissionsDelegate: ContactsPermissionsDelegate
) : ContactDetailsPicker {
  override suspend fun pick(fields: Set<ContactField>): GetContactDetailsRecord? {
    val extractableFields = mapper.toExtractableFields(fields).toSet()
    // With READ_CONTACTS we have access to all fields of the picked contact.
    // Without it we have access only to the Contacts table fields and one Data row at a time.
    return if (permissionsDelegate.hasReadPermission()) {
      pickContact(extractableFields)
    } else {
      pickContactData(extractableFields)
    }
  }

  override suspend fun pickMultiple(fields: Set<ContactField>): List<GetContactDetailsRecord> =
    listOfNotNull(pick(fields))

  private suspend fun pickContact(extractableFields: Set<ExtractableField<*>>): GetContactDetailsRecord? {
    val contactUri = intentDelegate.launchPickContact()
      ?: return null
    val contactIdString = contactUri.lastPathSegment
      ?: throw UnableToExtractIdFromUriException(contactUri)
    val pickedContact = repository.getById(extractableFields, ContactId(contactIdString))
      ?: throw ContactNotFoundException()
    return mapper.toRecord(pickedContact)
  }

  private suspend fun pickContactData(extractableFields: Set<ExtractableField<*>>): GetContactDetailsRecord? {
    val request = ContactDetailsPickerRequest(extractableFields)
    val dataKindUri = request.singleDataKindUri
      ?: throw ContactsPickerUnavailableException()
    val dataUri = intentDelegate.launchPickContactData(dataKindUri)
      ?: return null
    val pickedContact = repository.getAllByUri(request.sharedFields, dataUri).firstOrNull()
      ?: throw ContactNotFoundException()
    return mapper.toRecord(pickedContact)
  }
}
