package expo.modules.contacts.next.domain.model

import android.content.ContentProviderOperation
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.wrappers.ContactId

interface ClearableField {
  val mimeType: String

  fun toClearOperation(contactId: ContactId) =
    with(ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)) {
      withSelection(
        "${ContactId.COLUMN_IN_DATA_TABLE} = ? AND ${ContactsContract.Data.MIMETYPE} = ?",
        arrayOf(contactId.value, mimeType)
      )
      build()
    }
}
