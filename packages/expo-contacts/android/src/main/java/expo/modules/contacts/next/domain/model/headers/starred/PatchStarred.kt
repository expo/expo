package expo.modules.contacts.next.domain.model.headers.starred

import android.content.ContentValues
import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.kotlin.types.ValueOrUndefined

class PatchStarred(
  override val contactId: ContactId,
  starred: ValueOrUndefined<Boolean>
) : Updatable.Contacts {
  override val contentValues =
    ContentValues().apply {
      if (!starred.isUndefined) {
        put(ContactsContract.Contacts.STARRED, if (starred.optional == true) 1 else 0)
      }
    }
}
