package expo.modules.contacts.next

import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField

interface ContactDetailsPicker {
  suspend fun pick(fields: Set<ContactField>): GetContactDetailsRecord?
  suspend fun pickMultiple(fields: Set<ContactField>): List<GetContactDetailsRecord>
}
