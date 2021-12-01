package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds

import expo.modules.contacts.EXColumns

class ExtraNameModel : BaseModel() {
  override val contentType = CommonDataKinds.Nickname.CONTENT_ITEM_TYPE

  override val dataAlias = "value"

  override fun mapStringToType(label: String?) = when (label) {
    "default" -> CommonDataKinds.Nickname.TYPE_DEFAULT
    "initials" -> CommonDataKinds.Nickname.TYPE_INITIALS
    "maidenName" -> CommonDataKinds.Nickname.TYPE_MAIDEN_NAME
    "shortName" -> CommonDataKinds.Nickname.TYPE_SHORT_NAME
    "otherName" -> CommonDataKinds.Nickname.TYPE_OTHER_NAME
    else -> CommonDataKinds.Nickname.TYPE_CUSTOM
  }

  override fun getLabelFromCursor(cursor: Cursor) = super.getLabelFromCursor(cursor)
    ?: when (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
      CommonDataKinds.Nickname.TYPE_DEFAULT -> "nickname"
      CommonDataKinds.Nickname.TYPE_INITIALS -> "initials"
      CommonDataKinds.Nickname.TYPE_MAIDEN_NAME -> "maidenName"
      CommonDataKinds.Nickname.TYPE_SHORT_NAME -> "shortName"
      CommonDataKinds.Nickname.TYPE_OTHER_NAME -> "otherName"
      else -> "unknown"
    }

  override fun fromMap(readableMap: Map<String, Any?>) {
    super.fromMap(readableMap)
    // TODO: Evan: Decode contact data
  }
}
