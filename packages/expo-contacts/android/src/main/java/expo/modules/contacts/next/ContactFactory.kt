package expo.modules.contacts.next

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.mappers.domain.data.PhotoPropertyMapper

class ContactFactory(
  val contactRepository: ContactRepository,
  val contactMapper: ContactRecordDomainMapper,
  val photoPropertyMapper: PhotoPropertyMapper,
  val contactIntentDelegate: ContactIntentDelegate
) {
  fun create(contactId: ContactId): Contact {
    return Contact(contactId, contactRepository, contactMapper, photoPropertyMapper, contactIntentDelegate)
  }

  fun create(contactIdString: String): Contact {
    return create(ContactId(contactIdString))
  }
}
