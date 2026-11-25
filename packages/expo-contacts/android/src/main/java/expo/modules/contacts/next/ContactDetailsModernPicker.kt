package expo.modules.contacts.next

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.intents.ContactDetailsPickerRequest
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField

class ContactDetailsModernPicker(
  private val intentDelegate: ContactIntentDelegate,
  private val repository: ContactRepository,
  private val mapper: ContactRecordDomainMapper,
  private val permissionsDelegate: ContactsPermissionsDelegate,
  private val isDebuggable: () -> Boolean,
  private val warn: (String) -> Unit
) : ContactDetailsPicker {
  override suspend fun pick(fields: Set<ContactField>): GetContactDetailsRecord? {
    val extractableFields = mapper.toExtractableFields(fields).toSet()
    val request = ContactDetailsPickerRequest(extractableFields)
    warnAboutOlderAndroidIfNeeded(request)
    val sessionUri = intentDelegate.launchPickContactDetails(request.mimeTypes, allowsMultipleSelection = false)
      ?: return null
    val pickedContact = repository.getAllByUri(request.sharedFields, sessionUri).firstOrNull()
      ?: throw ContactNotFoundException()
    return mapper.toRecord(pickedContact)
  }

  override suspend fun pickMultiple(fields: Set<ContactField>): List<GetContactDetailsRecord> {
    val extractableFields = mapper.toExtractableFields(fields).toSet()
    val request = ContactDetailsPickerRequest(extractableFields)
    warnAboutOlderAndroidIfNeeded(request)
    val sessionUri = intentDelegate.launchPickContactDetails(request.mimeTypes, allowsMultipleSelection = true)
      ?: return emptyList()
    return repository.getAllByUri(request.sharedFields, sessionUri).map { mapper.toRecord(it) }
  }

  private fun warnAboutOlderAndroidIfNeeded(request: ContactDetailsPickerRequest) {
    if (!isDebuggable()) {
      return
    }
    if (request.singleDataKindUri != null || permissionsDelegate.isReadPermissionDeclared()) {
      return
    }
    warn("On Android 16 and lower, the contact details picker rejects this request: ${ContactsPickerUnavailableException.MESSAGE}")
  }
}
