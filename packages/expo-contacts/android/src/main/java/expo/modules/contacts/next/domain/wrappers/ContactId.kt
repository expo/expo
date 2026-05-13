package expo.modules.contacts.next.domain.wrappers

import android.provider.ContactsContract

@JvmInline
value class ContactId(val value: String) {
  companion object {
    const val COLUMN_IN_CONTACTS_TABLE = ContactsContract.Contacts._ID
    const val COLUMN_IN_RAW_CONTACTS_TABLE = ContactsContract.RawContacts.CONTACT_ID
    const val COLUMN_IN_DATA_TABLE = ContactsContract.Data.CONTACT_ID
  }
}
