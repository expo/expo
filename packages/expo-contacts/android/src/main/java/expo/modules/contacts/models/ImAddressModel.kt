package expo.modules.contacts.models

import android.content.ContentValues
import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds

class ImAddressModel : BaseModel() {
  override val contentType: String = CommonDataKinds.Im.CONTENT_ITEM_TYPE

  override val dataAlias: String = "username"

  private fun serializeService(protocol: Int): String {
    return when (protocol) {
      CommonDataKinds.Im.PROTOCOL_AIM -> "aim"
      CommonDataKinds.Im.PROTOCOL_GOOGLE_TALK -> "googleTalk"
      CommonDataKinds.Im.PROTOCOL_ICQ -> "icq"
      CommonDataKinds.Im.PROTOCOL_JABBER -> "jabber"
      CommonDataKinds.Im.PROTOCOL_MSN -> "msn"
      CommonDataKinds.Im.PROTOCOL_NETMEETING -> "netmeeting"
      CommonDataKinds.Im.PROTOCOL_QQ -> "qq"
      CommonDataKinds.Im.PROTOCOL_SKYPE -> "skype"
      CommonDataKinds.Im.PROTOCOL_YAHOO -> "yahoo"
      CommonDataKinds.Im.PROTOCOL_CUSTOM -> "custom"
      else -> "unknown"
    }
  }

  override fun fromCursor(cursor: Cursor) {
    super.fromCursor(cursor)
    map.putString("service", serializeService(cursor.getInt(cursor.getColumnIndexOrThrow(CommonDataKinds.Im.PROTOCOL))))
  }

  override val contentValues: ContentValues
    get() {
      val values = super.contentValues
      values.put(CommonDataKinds.Im.PROTOCOL, getString("service"))
      return values
    }
}
