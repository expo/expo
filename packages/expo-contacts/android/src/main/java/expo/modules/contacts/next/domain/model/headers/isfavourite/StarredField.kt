package expo.modules.contacts.next.domain.model.headers.isfavourite

import android.database.Cursor
import android.provider.ContactsContract.Contacts
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField

object StarredField: ExtractableField.Contacts<Starred> {
  override val projection = arrayOf(Contacts.STARRED)

  override fun extract(cursor: Cursor) =
    Starred(
      cursor.getInt(
        cursor.getColumnIndexOrThrow(Contacts.STARRED)
      )
    )
}

@JvmInline
value class Starred(val value: Int): Extractable
