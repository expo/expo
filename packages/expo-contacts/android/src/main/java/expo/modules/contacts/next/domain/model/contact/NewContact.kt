package expo.modules.contacts.next.domain.model.contact

import android.content.ContentProviderOperation
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.Insertable

data class NewContact(val modelsToInsert: List<Insertable>) {
  fun toInsertOperations(): ArrayList<ContentProviderOperation> {
    val output = arrayListOf<ContentProviderOperation>()
    output.add(
      ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
        .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
        .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
        .build()
    )
    output.addAll(modelsToInsert.map { it.toInsertOperation() })
    return output
  }
}
