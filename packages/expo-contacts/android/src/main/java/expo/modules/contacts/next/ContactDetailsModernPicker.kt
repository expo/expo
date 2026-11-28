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
    val sessionUri = intentDelegate.launchPickContactDetails(request.mimeTypes)
      ?: return null
    val pickedContact = repository.getByUri(request.sharedFields, sessionUri)
      ?: throw ContactNotFoundException()
    return mapper.toRecord(pickedContact)
  }

  private fun warnAboutOlderAndroidIfNeeded(request: ContactDetailsPickerRequest) {
    if (!isDebuggable()) {
      return
    }
    if (request.singleDataKindUri != null || permissionsDelegate.isReadPermissionDeclared()) {
      return
    }
    warn("On Android 16 and lower, Contact.pickDetails rejects this request: ${ContactsPickerUnavailableException.MESSAGE}")
  }
}
