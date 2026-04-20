package expo.modules.contacts.next.domain.wrappers

import android.net.Uri
import android.provider.ContactsContract
import expo.modules.contacts.next.UnableToExtractIdFromUriException

@JvmInline
value class RawContactId(val value: String) {
  companion object {
    fun from(rawContactUri: Uri): RawContactId {
      val rawContactIdString = rawContactUri.lastPathSegment
        ?: throw UnableToExtractIdFromUriException(rawContactUri)
      return RawContactId(rawContactIdString)
    }
    const val COLUMN_IN_RAW_CONTACTS_TABLE = ContactsContract.RawContacts._ID
    const val COLUMN_IN_DATA_TABLE = ContactsContract.Data.RAW_CONTACT_ID
  }
}
