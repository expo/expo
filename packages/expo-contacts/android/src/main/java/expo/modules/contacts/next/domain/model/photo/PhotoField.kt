package expo.modules.contacts.next.domain.model.photo

import android.database.Cursor
import android.provider.ContactsContract.CommonDataKinds.Photo
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.photo.operations.ExistingPhoto
import expo.modules.contacts.next.domain.wrappers.DataId

object PhotoField : ExtractableField.Data<ExistingPhoto> {
  override val mimeType = Photo.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    Photo._ID,
    Photo.PHOTO
  )

  override fun extract(cursor: Cursor): ExistingPhoto = with(cursor) {
    return@with ExistingPhoto(
      dataId = DataId(getString(getColumnIndexOrThrow(Photo._ID))),
      photo = getBlob(getColumnIndexOrThrow(Photo.PHOTO))
    )
  }
}
