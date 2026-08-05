package expo.modules.contacts.next.domain.model.nickname

import android.content.ContentValues
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Nickname

abstract class NicknameModel(
  val name: String?,
  val label: NicknameLabel
) {
  val mimeType = Nickname.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(ContactsContract.Data.MIMETYPE, mimeType)
      put(Nickname.NAME, name)
      put(Nickname.TYPE, label.type)
      put(Nickname.LABEL, label.label)
    }
}
