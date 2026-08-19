package expo.modules.contacts.next.domain.model.headers

import android.database.Cursor
import android.provider.ContactsContract.Contacts
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.extensions.getNullableString

object DisplayNameField : ExtractableField.Contacts<DisplayName> {
  override val projection = arrayOf(Contacts.DISPLAY_NAME)

  override fun extract(cursor: Cursor) =
    DisplayName(
      cursor.getNullableString(cursor.getColumnIndexOrThrow(Contacts.DISPLAY_NAME))
    )
}

@JvmInline
value class DisplayName(val value: String?) : Extractable
