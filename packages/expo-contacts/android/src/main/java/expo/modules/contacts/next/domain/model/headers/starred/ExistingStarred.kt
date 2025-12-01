package expo.modules.contacts.next.domain.model.headers.starred

import android.content.ContentValues
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId

class ExistingStarred(
  override val contactId: ContactId,
  starred: Boolean
): Updatable.Contacts {
  override val contentValues =
    ContentValues().apply {
      put(ContactsContract.Contacts.STARRED, if (starred) 1 else 0)
    }
}