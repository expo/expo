package expo.modules.contacts.next.domain.model.phone

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Phone

abstract class PhoneModel(
  val number: String?,
  val label: PhoneLabel
) {
  val mimeType = Phone.CONTENT_ITEM_TYPE
  open val contentValues =
    ContentValues().apply {
      put(Phone.NUMBER, number)
      put(Phone.TYPE, label.type)
      put(Phone.LABEL, label.label)
    }
}
