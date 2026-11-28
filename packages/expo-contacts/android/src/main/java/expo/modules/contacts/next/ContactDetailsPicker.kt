package expo.modules.contacts.next

import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField

fun interface ContactDetailsPicker {
  suspend fun pick(fields: Set<ContactField>): GetContactDetailsRecord?
}
