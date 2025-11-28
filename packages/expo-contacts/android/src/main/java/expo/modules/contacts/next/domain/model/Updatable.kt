package expo.modules.contacts.next.domain.model

import android.content.ContentProviderOperation
import android.content.ContentValues
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId


sealed interface Updatable {
  val contentValues: ContentValues
  fun toUpdateOperation(): ContentProviderOperation

  interface Contacts: Updatable {
    val contactId: ContactId

    override fun toUpdateOperation() =
      with(ContentProviderOperation.newUpdate(ContactsContract.Contacts.CONTENT_URI)){
        withSelection("${ContactsContract.Contacts._ID}=?", arrayOf(contactId.value))
        withValues(contentValues)
        build()
      }
  }

  interface Data: Updatable {
    val dataId: DataId
    val mimeType: String

    override fun toUpdateOperation() =
      with(ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)) {
        withSelection(
          "${DataId.COLUMN_IN_DATA_TABLE} = ? AND ${ContactsContract.Data.MIMETYPE} = ?",
          arrayOf(dataId.value, mimeType)
        )
        withValues(contentValues)
        build()
      }
  }
}
