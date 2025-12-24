package expo.modules.contacts.next.domain.model.headers

import android.database.Cursor
import android.provider.ContactsContract.Contacts
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField

object PhotoUriField : ExtractableField.Contacts<PhotoUri> {
  override val projection = arrayOf(Contacts.PHOTO_URI)

  override fun extract(cursor: Cursor) =
    PhotoUri(
      cursor.getString(
        cursor.getColumnIndexOrThrow(Contacts.PHOTO_URI)
      )
    )
}

@JvmInline
value class PhotoUri(val value: String?) : Extractable
