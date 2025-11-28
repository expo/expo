package expo.modules.contacts.next

import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper

class ContactFactory(
  val contactRepository: ContactRepository,
  val contactMapper: ContactRecordDomainMapper,
  val contactIntentDelegate: ContactIntentDelegate
) {
  fun create(contactId: ContactId): Contact {
    return Contact(contactId, contactRepository, contactMapper, contactIntentDelegate)
  }
  fun create(contactIdString: String): Contact {
    return create(ContactId(contactIdString))
  }
}
