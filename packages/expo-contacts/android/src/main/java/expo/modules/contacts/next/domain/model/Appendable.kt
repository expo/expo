package expo.modules.contacts.next.domain.model

import android.content.ContentProviderOperation
import android.content.ContentValues
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.wrappers.RawContactId

interface Appendable {
  val rawContactId: RawContactId
  val mimeType: String
  val contentValues: ContentValues

  fun toAppendOperation() =
    with(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)) {
      withValue(ContactsContract.Data.RAW_CONTACT_ID, rawContactId.value)
      withValues(contentValues)
      build()
    }
}
