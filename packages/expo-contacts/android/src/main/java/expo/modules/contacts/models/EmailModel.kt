package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract
import expo.modules.contacts.Columns

class EmailModel : BaseModel() {
  override val contentType: String = ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE
  override val dataAlias: String = "email"

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        ContactsContract.CommonDataKinds.Email.TYPE_HOME -> "home"
        ContactsContract.CommonDataKinds.Email.TYPE_WORK -> "work"
        ContactsContract.CommonDataKinds.Email.TYPE_MOBILE -> "mobile"
        ContactsContract.CommonDataKinds.Email.TYPE_OTHER -> "other"
        else -> "unknown"
      }
  }
}
