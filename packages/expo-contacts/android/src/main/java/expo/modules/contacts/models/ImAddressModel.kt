package expo.modules.contacts.models

import android.provider.ContactsContract.CommonDataKinds
import android.content.ContentValues
import android.database.Cursor

class ImAddressModel : BaseModel() {
  override val contentType = CommonDataKinds.Im.CONTENT_ITEM_TYPE

  override val dataAlias = "username"

  private fun serializeService(protocol: Int) = when (protocol) {
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

  override fun fromCursor(cursor: Cursor) {
    super.fromCursor(cursor)
    map.putString("service", serializeService(cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.PROTOCOL))))
  }

  override val contentValues: ContentValues = super.contentValues.apply {
    put(CommonDataKinds.Im.PROTOCOL, getString("service"))
  }
}
