package expo.modules.contacts.next.domain.model.photo

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Photo
import expo.modules.contacts.next.domain.model.Insertable

class NewPhoto(
  val photoBytes: ByteArray
) : Insertable {
  override val mimeType = Photo.CONTENT_ITEM_TYPE

  override val contentValues =
    ContentValues().apply {
      put(Photo.PHOTO, photoBytes)
    }
}
