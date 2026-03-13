package expo.modules.contacts.next.observers

import android.database.ContentObserver
import android.net.Uri
import android.os.Handler
import expo.modules.contacts.next.ContactsNextModule
import expo.modules.contacts.onContactsChangeEventName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.weak

class ContactsObserver(module: ContactsNextModule, handler: Handler) : ContentObserver(handler) {
  val moduleRef = module.weak()

  override fun onChange(selfChange: Boolean, uri: Uri?) {
    super.onChange(selfChange, uri)
    moduleRef.get()?.handleContactChange()
  }

  fun Module.handleContactChange() {
    sendEvent(
      onContactsChangeEventName,
      mapOf(
        "body" to null
      )
    )
  }
}
