package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.Columns

class EmailModel : BaseModel() {
  override val contentType: String = CommonDataKinds.Email.CONTENT_ITEM_TYPE
  override val dataAlias: String = "email"

  override fun mapStringToType(label: String?): Int {
    val mailType = when (label) {
      "home" -> CommonDataKinds.Phone.TYPE_HOME
      "mobile" -> CommonDataKinds.Phone.TYPE_MOBILE
      "work" -> CommonDataKinds.Phone.TYPE_WORK
      "other" -> CommonDataKinds.Phone.TYPE_OTHER
      else -> Columns.TYPE_CUSTOM
    }
    return mailType
  }

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        CommonDataKinds.Email.TYPE_HOME -> "home"
        CommonDataKinds.Email.TYPE_WORK -> "work"
        CommonDataKinds.Email.TYPE_MOBILE -> "mobile"
        CommonDataKinds.Email.TYPE_OTHER -> "other"
        else -> "unknown"
      }
  }
}
