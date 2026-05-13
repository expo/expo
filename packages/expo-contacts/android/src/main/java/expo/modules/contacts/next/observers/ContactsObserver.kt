package expo.modules.contacts.next.observers

import android.database.ContentObserver
import android.net.Uri
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

// Passing null to ContentObserver dispatches onChange on a binder thread
class ContactsObserver(
  private val observerScope: CoroutineScope,
  private val contactsChange: OnContactsChange
) : ContentObserver(null) {
  override fun onChange(selfChange: Boolean, uri: Uri?) {
    observerScope.launch {
      contactsChange.invoke()
    }
  }
}
