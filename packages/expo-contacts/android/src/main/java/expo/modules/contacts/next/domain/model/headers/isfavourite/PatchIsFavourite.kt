package expo.modules.contacts.next.domain.model.headers.isfavourite

import android.content.ContentValues
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId

class PatchIsFavourite(override val contactId: ContactId): Updatable.Contacts {
  override val contentValues: ContentValues
    get() = TODO("Not yet implemented")
}