package expo.modules.contacts.next.observers

import android.content.ContentResolver
import android.provider.ContactsContract
import kotlinx.coroutines.CoroutineScope

class ContactsObserverDelegate(
  private val contentResolver: ContentResolver,
  observerScope: CoroutineScope,
  onContactsChange: OnContactsChange
) {
  val observer = ContactsObserver(observerScope, onContactsChange)

  fun startObserving() {
    listOf(
      ContactsContract.Contacts.CONTENT_URI,
      ContactsContract.RawContacts.CONTENT_URI
    ).forEach {
      contentResolver.registerContentObserver(it, true, observer)
    }
  }

  fun stopObserving() {
    contentResolver.unregisterContentObserver(observer)
  }
}
