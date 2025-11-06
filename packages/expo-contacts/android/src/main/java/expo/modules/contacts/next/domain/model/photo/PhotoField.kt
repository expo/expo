package expo.modules.contacts.next.domain.model.photo

import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract.CommonDataKinds.Contactables
import android.provider.ContactsContract.CommonDataKinds.Photo
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.DataId

object PhotoField : ExtractableField<ExistingPhoto> {
  override val mimeType = Photo.CONTENT_ITEM_TYPE

  override val projection = arrayOf(
    Photo._ID,
    Photo.PHOTO,
    Contactables.PHOTO_URI,
    Contactables.PHOTO_THUMBNAIL_URI
  )

  override fun extract(cursor: Cursor): ExistingPhoto = with(cursor) {
    return@with ExistingPhoto(
      dataId = DataId(getString(getColumnIndexOrThrow(Photo._ID))),
      photoBytes = getBlob(getColumnIndexOrThrow(Photo.PHOTO)),
      photoUri = Uri.parse(getString(getColumnIndexOrThrow(Contactables.PHOTO_URI))),
      thumbnailPhotoUri = Uri.parse(getString(getColumnIndexOrThrow(Contactables.PHOTO_URI)))
    )
  }
}
