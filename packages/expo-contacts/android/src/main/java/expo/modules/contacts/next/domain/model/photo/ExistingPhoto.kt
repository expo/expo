package expo.modules.contacts.next.domain.model.photo

import android.content.ContentValues
import android.net.Uri
import android.provider.ContactsContract.CommonDataKinds.Photo
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingPhoto(
  override val dataId: DataId,
  val photoUri: Uri,
  val thumbnailPhotoUri: Uri,
  val photoBytes: ByteArray
) : Extractable, Updatable {
  override val mimeType = Photo.CONTENT_ITEM_TYPE
  override val contentValues =
    ContentValues().apply {
      put(Photo.PHOTO, photoBytes)
    }
}
