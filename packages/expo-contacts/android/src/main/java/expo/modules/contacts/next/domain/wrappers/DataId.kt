package expo.modules.contacts.next.domain.wrappers

import android.provider.ContactsContract

@JvmInline
value class DataId(val value: String) {
  companion object {
    const val COLUMN_IN_DATA_TABLE = ContactsContract.Data._ID
  }
}
