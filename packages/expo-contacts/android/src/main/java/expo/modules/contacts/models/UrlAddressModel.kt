package expo.modules.contacts.models

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.EXColumns

class UrlAddressModel : BaseModel() {
  override val contentType: String
    get() = CommonDataKinds.Website.CONTENT_ITEM_TYPE
  override val dataAlias: String
    get() = "url"

  override fun getLabelFromCursor(cursor: Cursor): String? {
    val label = super.getLabelFromCursor(cursor)
    return label
        ?: when (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
          CommonDataKinds.Website.TYPE_HOME -> "home"
          CommonDataKinds.Website.TYPE_WORK -> "work"
          CommonDataKinds.Website.TYPE_BLOG -> "blog"
          CommonDataKinds.Website.TYPE_FTP -> "ftp"
          CommonDataKinds.Website.TYPE_HOMEPAGE -> "homepage"
          CommonDataKinds.Website.TYPE_PROFILE -> "profile"
          CommonDataKinds.Website.TYPE_OTHER -> "other"
          else -> "unknown"
        }
  }
}
