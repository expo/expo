package expo.modules.contacts.next.domain.model.email

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Email

abstract class EmailModel(
  val address: String? = null,
  val label: EmailLabel
) {
  val mimeType = Email.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(Email.ADDRESS, address)
      put(Email.TYPE, label.type)
      put(Email.LABEL, label.label)
    }
}
