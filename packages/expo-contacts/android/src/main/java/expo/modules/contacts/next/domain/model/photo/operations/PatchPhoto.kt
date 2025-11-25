package expo.modules.contacts.next.domain.model.photo.operations

import android.content.ContentValues
import android.provider.ContactsContract.CommonDataKinds.Photo
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.photo.PhotoModel
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchPhoto(
  override val dataId: DataId,
  photo: ValueOrUndefined<ByteArray?> = ValueOrUndefined.Undefined(),
) : PhotoModel(photo.optional), Updatable.Data {
  override val contentValues = ContentValues().apply {
    if (!photo.isUndefined) {
      put(Photo.PHOTO, photo.optional)
    }
  }
}
