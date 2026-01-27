package expo.modules.contacts.next.domain.model.headers

import android.database.Cursor
import android.provider.ContactsContract.Contacts
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField

object PhotoThumbnailUriField : ExtractableField.Contacts<PhotoThumbnailUri> {
  override val projection = arrayOf(Contacts.PHOTO_THUMBNAIL_URI)

  override fun extract(cursor: Cursor) =
    PhotoThumbnailUri(
      cursor.getString(cursor.getColumnIndexOrThrow(Contacts.PHOTO_THUMBNAIL_URI))
    )
}

@JvmInline
value class PhotoThumbnailUri(val value: String?) : Extractable
