package expo.modules.contacts.next.domain.model.contact

import android.content.ContentProviderOperation
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.Insertable

data class NewContact(
  val starred: Boolean,
  val modelsToInsert: List<Insertable>
) {
  fun toInsertOperations() = buildList {
    add(
      ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
        .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
        .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
        .withValue(ContactsContract.RawContacts.STARRED, starred)
        .build()
    )
    addAll(modelsToInsert.map { it.toInsertOperation() })
  }
}
