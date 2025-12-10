package expo.modules.contacts.next.domain.model.photo

import android.content.ContentValues
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Photo

abstract class PhotoModel(
  val photo: ByteArray?
) {
  val mimeType = Photo.CONTENT_ITEM_TYPE

  open val contentValues =
    ContentValues().apply {
      put(ContactsContract.Data.MIMETYPE, mimeType)
      put(Photo.PHOTO, photo)
    }
}
