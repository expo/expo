package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract

import expo.modules.contacts.EXColumns

class EmailModel : BaseModel() {
  override val contentType = ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE

  override val dataAlias = "email"

  override fun getLabelFromCursor(cursor: Cursor) = super.getLabelFromCursor(cursor)
    ?: when (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
      ContactsContract.CommonDataKinds.Email.TYPE_HOME -> "home"
      ContactsContract.CommonDataKinds.Email.TYPE_WORK -> "work"
      ContactsContract.CommonDataKinds.Email.TYPE_MOBILE -> "mobile"
      ContactsContract.CommonDataKinds.Email.TYPE_OTHER -> "other"
      else -> "unknown"
    }
}
