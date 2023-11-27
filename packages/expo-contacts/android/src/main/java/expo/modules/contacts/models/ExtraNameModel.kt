package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.Columns

class ExtraNameModel : BaseModel() {
  override val contentType: String = CommonDataKinds.Nickname.CONTENT_ITEM_TYPE
  override val dataAlias: String = "value"

  override fun mapStringToType(label: String?): Int {
    return when (label) {
      "default" -> CommonDataKinds.Nickname.TYPE_DEFAULT
      "initials" -> CommonDataKinds.Nickname.TYPE_INITIALS
      "maidenName" -> CommonDataKinds.Nickname.TYPE_MAIDEN_NAME
      "shortName" -> CommonDataKinds.Nickname.TYPE_SHORT_NAME
      "otherName" -> CommonDataKinds.Nickname.TYPE_OTHER_NAME
      else -> CommonDataKinds.Nickname.TYPE_CUSTOM
    }
  }

  override fun getLabelFromCursor(cursor: Cursor): String {
    val label = super.getLabelFromCursor(cursor)
    return label
      ?: when (cursor.getInt(cursor.getColumnIndexOrThrow(Columns.TYPE))) {
        CommonDataKinds.Nickname.TYPE_DEFAULT -> "nickname"
        CommonDataKinds.Nickname.TYPE_INITIALS -> "initials"
        CommonDataKinds.Nickname.TYPE_MAIDEN_NAME -> "maidenName"
        CommonDataKinds.Nickname.TYPE_SHORT_NAME -> "shortName"
        CommonDataKinds.Nickname.TYPE_OTHER_NAME -> "otherName"
        else -> "unknown"
      }
  }
}
