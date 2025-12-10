package expo.modules.contacts.next.domain.model

import android.content.ContentProviderOperation
import android.content.ContentValues
import android.provider.ContactsContract

interface Insertable {
  val mimeType: String
  val contentValues: ContentValues

  fun toInsertOperation() =
    with(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)) {
      withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      withValues(contentValues)
      build()
    }
}
